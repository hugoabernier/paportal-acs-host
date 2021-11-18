import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import {
  CallComposite,
  CallAdapter,
  createAzureCommunicationCallAdapter,
  createAzureCommunicationChatAdapter,
  ChatAdapter,
  ChatComposite
} from '@azure/communication-react';
import { useAsyncMemo } from "use-async-memo"
import { CommunicationIdentityClient } from '@azure/communication-identity';
import { useEffect, useMemo, useState } from 'react';

function ACSHost(): JSX.Element {
  const root = document.getElementById('acs-host');
  const useChat: boolean = root?.getAttribute('data-use-chat') === 'true';

  const displayName = root?.getAttribute('data-name') + "";

  const meetingLink = root?.getAttribute('data-meetinglink') + "";

  const connectionString = root?.getAttribute('data-connectionstring') + "";

  const threadId = useMemo(() => {
    // Get the threadId from the url - this also contains the call locator ID that will be removed in the threadId.split
    let threadId = meetingLink.replace('https://teams.microsoft.com/l/meetup-join/', '');

    // Decode characters that outlook links encode
    threadId = threadId.replaceAll('%3a', ':').replace('%40', '@');

    // Extract just the chat guid from the link, stripping away the call locator ID
    threadId = threadId.split(/^(.*?@thread\.v2)/gm)[1];

    if (!threadId || threadId.length === 0) throw new Error('Could not get chat thread from teams link');

    return threadId;
  }, [meetingLink]);

  const endpointUrl = useMemo(() => {
    const reEndPoint: RegExp = new RegExp("endpoint=(https://.*)(?:;|$)");
    const matchObj = reEndPoint.exec(connectionString);
    if (matchObj && matchObj.length > 1) {
      return matchObj[1];
    }
    throw new Error('Could not get endpoint from connection string');
  }, [connectionString])

  //Calling Variables
  const [callAdapter, setCallAdapter] = useState<CallAdapter>();

  const [chatAdapter, setChatAdapter] = useState<ChatAdapter>();

  const tokenResponse = useAsyncMemo(async () => {
    const identityClient = new CommunicationIdentityClient(connectionString);

    let identityTokenResponse = await identityClient.createUserAndToken(useChat ? ["voip", "chat"] : ["voip"]);
    const { token, user } = identityTokenResponse;

    return {
      token: token,
      userId: user.communicationUserId
    };

  }, [connectionString]);

  useEffect(() => {
    const createAdapter = async (): Promise<void> => {
      useChat && setChatAdapter(
        await createAzureCommunicationChatAdapter({
          endpointUrl,
          userId: { kind: 'communicationUser', communicationUserId: tokenResponse.userId },
          displayName,
          credential: new AzureCommunicationTokenCredential(tokenResponse.token),
          threadId: threadId
        })
      );
      setCallAdapter(
        await createAzureCommunicationCallAdapter({
          userId: { kind: 'communicationUser', communicationUserId: tokenResponse.userId },
          displayName,
          credential: new AzureCommunicationTokenCredential(tokenResponse.token),
          locator: { meetingLink: meetingLink + "" }
        })
      );
    };
    tokenResponse && createAdapter();
  }, [useChat, displayName, endpointUrl, meetingLink, threadId, tokenResponse]);

  if (!!callAdapter && !!chatAdapter) {
    return (
      <>
        <CallComposite adapter={callAdapter} />
        <ChatComposite adapter={chatAdapter} />
      </>
    );
  } else if (!!callAdapter) {
    return (
      <CallComposite adapter={callAdapter} />
    );
  }
  return <div></div>;
}

export default ACSHost;