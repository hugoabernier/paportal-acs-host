import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import {
  CallComposite,
  CallAdapter,
  createAzureCommunicationCallAdapter,
  ChatComposite,
  ChatAdapter,
  createAzureCommunicationChatAdapter
} from '@azure/communication-react';
import {useAsyncMemo} from "use-async-memo"
import { CommunicationIdentityClient }  from '@azure/communication-identity';
import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

function App(): JSX.Element {
  const queryString = window.location.search;
  console.log(queryString);

  const root = document.getElementById('root');
  
  const displayName = root?.getAttribute('data-name')+"";
  const meetingLink = root?.getAttribute('data-meetinglink')+"";
  
  const endpointUrl = root?.getAttribute('data-endpoint')+"";
  
  const connectionString = root?.getAttribute('data-connectionstring')+"";

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

  //Calling Variables
  const [callAdapter, setCallAdapter] = useState<CallAdapter>();

  //Chat Variables
  const [chatAdapter, setChatAdapter] = useState<ChatAdapter>();

  const [token, userId] = useAsyncMemo(async () => {
    // const identityClient = new CommunicationIdentityClient(connectionString);

    // let identityResponse = await identityClient.createUser();
    // console.log(`\nCreated an identity with ID: ${identityResponse.communicationUserId}`);

    // // Issue an access token with the "voip" scope for an identity
    // let tokenResponse = await identityClient.getToken(identityResponse, ["voip"]);
    // const { token, expiresOn } = tokenResponse;
    // console.log(`\nIssued an access token with 'voip' scope that expires at ${expiresOn}:`);
    // console.log(token);
  
    // Instantiate the identity client
    const identityClient = new CommunicationIdentityClient(connectionString);
    console.log("\nIdentity client", identityClient);

    let identityTokenResponse = await identityClient.createUserAndToken(["voip"]);
    const { token, expiresOn, user } = identityTokenResponse;
    console.log(`\nCreated an identity with ID: ${user.communicationUserId}`);
    console.log(`\nIssued an access token with 'voip' scope that expires at ${expiresOn}:`);
    console.log(token);
    
    return [ token, user.communicationUserId];
  },[connectionString]);

  const credential = useMemo(() => {
    try {
      return new AzureCommunicationTokenCredential(token);
    } catch {
      console.error('Failed to construct token credential');
      return undefined;
    }
  }, [token]);

  useEffect(() => {
    const createAdapter = async (): Promise<void> => {
      setChatAdapter(
        await createAzureCommunicationChatAdapter({
          endpointUrl,
          userId: { kind: 'communicationUser', communicationUserId: userId },
          displayName,
          credential: new AzureCommunicationTokenCredential(token),
          threadId: threadId
        })
      );
      setCallAdapter(
        await createAzureCommunicationCallAdapter({
          userId: { kind: 'communicationUser', communicationUserId: userId },
          displayName,
          credential: new AzureCommunicationTokenCredential(token),
          locator: { meetingLink: meetingLink+ ""  }
        })
      );
    };
    createAdapter();
  }, [displayName, endpointUrl, meetingLink, threadId, token, userId]);

  if (!!callAdapter && !!chatAdapter) {
    return (
      <>
        {/* <ChatComposite adapter={chatAdapter} /> */}
        <CallComposite adapter={callAdapter} />
      </>
    );
  }
  if (credential === undefined) {
    return <h3>Failed to construct credential. Provided token is malformed.</h3>;
  }
  return <div></div>;
}

export default App;