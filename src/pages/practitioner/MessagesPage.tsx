import { Helmet } from 'react-helmet-async';

export default function PractitionerMessagesPage() {
  return (
    <>
      <Helmet>
        <title>Messages — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Messages</h1>
      <p className="mt-2 text-muted-foreground">Shared chat shell with patient Messages page.</p>
    </>
  );
}
