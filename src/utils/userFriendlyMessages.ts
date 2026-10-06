/**
 * Converts API/mock errors into short, reassuring copy suitable for the app UI.
 * The backend can keep its diagnostic message; users should only see this layer.
 */
export const getUserFriendlyMessage = (value: unknown, fallback = 'Please try again.') => {
  const error = value as any;
  const raw =
    typeof value === 'string'
      ? value
      : error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message;

  const message = String(raw || '').trim();
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (lower.includes('profile must be complete')) {
    return 'Please finish your profile and add at least 2 photos before sending an invitation.';
  }
  if (lower.includes('active subscription is required')) {
    return 'Choose a membership plan to start sending invitations.';
  }
  if (lower.includes('daily request limit') || lower.includes('daily invitation limit')) {
    return "You've reached today's invitation limit. Upgrade your plan to keep connecting.";
  }
  if (lower.includes('already been sent') || lower.includes('already invited')) {
    return "You've already sent an invitation to this person.";
  }
  if (lower.includes('women cannot send') || lower.includes('only be sent to women')) {
    return 'Invitations are available for eligible matches only.';
  }
  if (lower.includes('connection request not found')) {
    return 'This invitation is no longer available.';
  }
  if (lower.includes('request is only allowed to move') || lower.includes('only move from pending')) {
    return 'Invitations stay active until they are approved.';
  }
  if (lower.includes('unable to resolve') || lower.includes('missing a valid account')) {
    return 'We could not connect your account. Please sign in again.';
  }
  if (lower.includes('user not found')) {
    return 'We could not find that account. Please sign in again.';
  }
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('connect to server')) {
    return "We couldn't connect right now. Please check your internet and try again.";
  }
  if (/\b(br|fr|http|status code|api|backend|userId|requestId)\b/i.test(message)) {
    return fallback;
  }

  return message;
};

export const getUserFriendlyTitle = (value: string) => {
  const lower = String(value || '').toLowerCase();
  if (lower.includes('recalled') || lower.includes('recall')) return 'Invitation update';
  if (lower.includes('approval failed')) return "Couldn't approve invitation";
  if (lower.includes('invite failed')) return "Couldn't send invitation";
  if (lower === 'error' || lower.includes('failed')) return 'Something went wrong';
  return value;
};

export const isSubscriptionGateError = (error: any) => {
  const code = String(error?.response?.data?.code || error?.code || '').toUpperCase();
  const message = String(
    error?.response?.data?.message || error?.response?.data?.error || error?.message || '',
  ).toLowerCase();

  return (
    code === 'SUBSCRIPTION_REQUIRED' ||
    code === 'QUOTA_EXCEEDED' ||
    message.includes('active subscription is required') ||
    message.includes('subscription required') ||
    message.includes('daily request limit') ||
    message.includes('daily invitation limit') ||
    message.includes('quota exceeded')
  );
};
