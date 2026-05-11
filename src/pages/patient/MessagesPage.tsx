import { MessagingWorkspace } from '@/components/messaging/MessagingWorkspace';
import { ROUTES } from '@/router/routes';

export default function PatientMessagesPage() {
  return (
    <MessagingWorkspace messagesBasePath={ROUTES.patient.messages} appointmentDetailPath={ROUTES.patient.appointment} />
  );
}
