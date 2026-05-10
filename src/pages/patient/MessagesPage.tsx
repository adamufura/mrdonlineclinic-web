import { Helmet } from 'react-helmet-async';

export default function PatientMessagesPage() {
  return (
    <>
      <Helmet>
        <title>Messages — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Messages</h1>
      <p className="mt-2 text-muted-foreground">Chat UI + socket.io-client will connect here.</p>
    </>
  );
}
