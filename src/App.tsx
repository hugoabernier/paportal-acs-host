import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import {
  CallComposite,
  CallAdapter,
  createAzureCommunicationCallAdapter
} from '@azure/communication-react';
import {useAsyncMemo} from "use-async-memo"
import { CommunicationIdentityClient }  from '@azure/communication-identity';
import { useEffect, useMemo, useState } from 'react';
import './App.css';

function App(): JSX.Element {
  const queryString = window.location.search;
  console.log(queryString);

  const root = document.getElementById('acs-host');
  
  const displayName = root?.getAttribute('data-name')+"";
  console.log("Display Name", displayName);

  const meetingLink = root?.getAttribute('data-meetinglink')+"";
  console.log("Meeting Link", meetingLink);

  const endpointUrl = root?.getAttribute('data-endpoint')+"";
  console.log("Endpoint URL", endpointUrl);

  const connectionString = root?.getAttribute('data-connectionstring')+"";
  console.log("Connection string", connectionString);

  const threadId = useMemo(() => {
    // Get the threadId from the url - this also contains the call locator ID that will be removed in the threadId.split
    let threadId = meetingLink.replace('https://teams.microsoft.com/l/meetup-join/', '');
    console.log("Thread ID Before", threadId);
    // Decode characters that outlook links encode
    threadId = threadId.replaceAll('%3a', ':').replace('%40', '@');
    // Extract just the chat guid from the link, stripping away the call locator ID
    threadId = threadId.split(/^(.*?@thread\.v2)/gm)[1];
  
    if (!threadId || threadId.length === 0) throw new Error('Could not get chat thread from teams link');
  
    console.log("Thread ID After", threadId);
    return threadId;
  }, [meetingLink]);

  //Calling Variables
  const [callAdapter, setCallAdapter] = useState<CallAdapter>();
  
  const tokenResponse = useAsyncMemo(async () => {
    const identityClient = new CommunicationIdentityClient(connectionString);
    console.log("\nIdentity client", identityClient);

    let identityTokenResponse = await identityClient.createUserAndToken(["voip"]);
    const { token, expiresOn, user } = identityTokenResponse;
    console.log(`\nCreated an identity with ID: ${user.communicationUserId}`);
    console.log(`\nIssued an access token with 'voip' scope that expires at ${expiresOn}:`);
    console.log(token);
    
    return {
      token: token, 
      userId: user.communicationUserId 
    };

  },[connectionString]);

  // const credential = useMemo(() => {
  //   try {
  //     return new AzureCommunicationTokenCredential(tokenResponse.token);
  //   } catch {
  //     console.error('Failed to construct token credential');
  //     return undefined;
  //   }
  // }, [tokenResponse]);

  useEffect(() => {
    const createAdapter = async (): Promise<void> => {
      console.log("Create adapter", tokenResponse)
      // setChatAdapter(
      //   await createAzureCommunicationChatAdapter({
      //     endpointUrl,
      //     userId: { kind: 'communicationUser', communicationUserId: tokenResponse.userId },
      //     displayName,
      //     credential: new AzureCommunicationTokenCredential(tokenResponse.token),
      //     threadId: threadId
      //   })
      // );
      setCallAdapter(
        await createAzureCommunicationCallAdapter({
          userId: { kind: 'communicationUser', communicationUserId: tokenResponse.userId },
          displayName,
          credential: new AzureCommunicationTokenCredential(tokenResponse.token),
          locator: { meetingLink: meetingLink+ ""  }
        })
      );
    };
    tokenResponse && createAdapter();
  }, [displayName, endpointUrl, meetingLink, threadId, tokenResponse]);

  if (!!callAdapter) {
    return (
        <CallComposite adapter={callAdapter} />
    );
  }
  // if (credential === undefined) {
  //   return <h3>Failed to construct credential. Provided token is malformed.</h3>;
  // }
  return <div>It works</div>;
}

export default App;