import { MessagingWorkspace } from '@/components/messaging/MessagingWorkspace';
import { ROUTES } from '@/router/routes';

export default function PractitionerMessagesPage() {
  return (
    <MessagingWorkspace
      messagesBasePath={ROUTES.practitioner.messages}
      appointmentDetailPath={ROUTES.practitioner.appointment}
    />
  );
}
