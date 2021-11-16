import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import {
  CallComposite,
  CallAdapter,
  createAzureCommunicationCallAdapter,
  ChatComposite,
  ChatAdapter,
  createAzureCommunicationChatAdapter
} from '@azure/communication-react';
import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

function App(): JSX.Element {
  const queryString = window.location.search;
  console.log(queryString);

  //const urlParams = new URLSearchParams(queryString);

  // data-name="Rita"
  // data-meetinglink="meetinglink"
  // data-endpoint="https://wealthpocacs_can.communication.azure.com/"
  // data-userid="8:acs:18933309-22c0-46d1-a96c-aef1e8743949_0000000c-e847-f0cd-5dbd-9f3a0d0007e9"
  // data-token="eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwMyIsIng1dCI6Ikc5WVVVTFMwdlpLQTJUNjFGM1dzYWdCdmFMbyIsInR5cCI6IkpXVCJ9.eyJza3lwZWlkIjoiYWNzOjE4OTMzMzA5LTIyYzAtNDZkMS1hOTZjLWFlZjFlODc0Mzk0OV8wMDAwMDAwYy1lODQ3LWYwY2QtNWRiZC05ZjNhMGQwMDA3ZTkiLCJzY3AiOjE3OTIsImNzaSI6IjE2MzMzMDIyMzYiLCJleHAiOjE2MzMzODg2MzYsImFjc1Njb3BlIjoiY2hhdCx2b2lwIiwicmVzb3VyY2VJZCI6IjE4OTMzMzA5LTIyYzAtNDZkMS1hOTZjLWFlZjFlODc0Mzk0OSIsImlhdCI6MTYzMzMwMjIzNn0.E2B-uLQqwi_KYSps1mFqKbDK7BOzYkhzWuUddvt4rAHbN1J6wUf0tgO59XqsAu6TEcCNgHU2DSw3Gnb-6GeGyBD41f7b1x3VcQLTH8B4cADNSUPKexoO3XnMOHqq4l4Y6i1ZVm0Romkq_2B_AJsTLvisGv_Ii5gf2UVf3-lWCU_WZ5RfQQSVwsDr2S__YPLkA-C3ChRH9N5PQA5S-eBW101Xk5cwi-MOyDzHTK_DBPy_8Xf1pErawLXXAt5UPK7dgWuc64p0L7eh9ooJeOIBFJlT_pePI1flkC17LDZgUAXnyEaLOaTJNqd8BdzKBu8GK01c_ed_DTvSCDO8A0ElbQ"

  const root = document.getElementById('root');
  
  const attendee = root?.getAttribute('data-name')+"";
  const meetingLink = root?.getAttribute('data-meetinglink')+"";
  
  const endpointUrl = root?.getAttribute('data-endpoint')+"";
  const userId = root?.getAttribute('data-userid')+""; 
  const displayName = attendee+"";
  const token = root?.getAttribute('data-token')+"";

  // const endpointUrl = 'https://wealthpocacs_can.communication.azure.com/';
  // const userId = '8:acs:18933309-22c0-46d1-a96c-aef1e8743949_0000000c-e847-f0cd-5dbd-9f3a0d0007e9';
  // const displayName = attendee+"";
  // const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwMyIsIng1dCI6Ikc5WVVVTFMwdlpLQTJUNjFGM1dzYWdCdmFMbyIsInR5cCI6IkpXVCJ9.eyJza3lwZWlkIjoiYWNzOjE4OTMzMzA5LTIyYzAtNDZkMS1hOTZjLWFlZjFlODc0Mzk0OV8wMDAwMDAwYy1lODQ3LWYwY2QtNWRiZC05ZjNhMGQwMDA3ZTkiLCJzY3AiOjE3OTIsImNzaSI6IjE2MzMzMDIyMzYiLCJleHAiOjE2MzMzODg2MzYsImFjc1Njb3BlIjoiY2hhdCx2b2lwIiwicmVzb3VyY2VJZCI6IjE4OTMzMzA5LTIyYzAtNDZkMS1hOTZjLWFlZjFlODc0Mzk0OSIsImlhdCI6MTYzMzMwMjIzNn0.E2B-uLQqwi_KYSps1mFqKbDK7BOzYkhzWuUddvt4rAHbN1J6wUf0tgO59XqsAu6TEcCNgHU2DSw3Gnb-6GeGyBD41f7b1x3VcQLTH8B4cADNSUPKexoO3XnMOHqq4l4Y6i1ZVm0Romkq_2B_AJsTLvisGv_Ii5gf2UVf3-lWCU_WZ5RfQQSVwsDr2S__YPLkA-C3ChRH9N5PQA5S-eBW101Xk5cwi-MOyDzHTK_DBPy_8Xf1pErawLXXAt5UPK7dgWuc64p0L7eh9ooJeOIBFJlT_pePI1flkC17LDZgUAXnyEaLOaTJNqd8BdzKBu8GK01c_ed_DTvSCDO8A0ElbQ';

  //Calling Variables
  //For Group Id, developers can pass any GUID they can generate
  //const groupId = '7ec37ad8-69cb-4999-99ce-acab3be7b1c5';
  const [callAdapter, setCallAdapter] = useState<CallAdapter>();

  //Chat Variables
  //const threadId = '<Get thread id from chat service>';
  const [chatAdapter, setChatAdapter] = useState<ChatAdapter>();

  // We can't even initialize the Chat and Call adapters without a well-formed token.
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
          threadId: "19:meeting_YWRjMTI3NmQtNTkwZS00MDRjLTg4YmUtNzUyNTU2ZDQ0N2Vh@thread.v2"
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
  }, []);

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