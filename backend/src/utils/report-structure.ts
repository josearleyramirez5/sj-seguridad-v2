interface StructuredRoutingData {
  version?: number;
  assignedSupervisor?: { id?: string } | null;
  generatedBy?: { id?: string } | null;
  guard?: { userId?: string } | null;
  guardObservation?: string;
}

export function parseStructuredRoutingData(description: string): StructuredRoutingData | null {
  try {
    const parsed = JSON.parse(description) as StructuredRoutingData;

    if (typeof parsed === 'object' && parsed !== null && parsed.version === 2) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function canViewStructuredReport(description: string, user: { id: string; role: string }) {
  const parsed = parseStructuredRoutingData(description);

  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  if (!parsed) {
    return false;
  }

  if (user.role === 'SUPERVISOR') {
    return parsed.assignedSupervisor?.id === user.id || parsed.generatedBy?.id === user.id;
  }

  if (user.role === 'GUARD') {
    return parsed.guard?.userId === user.id;
  }

  return false;
}

export function withGuardObservation(description: string, observation: string) {
  const parsed = parseStructuredRoutingData(description);

  if (!parsed) {
    return null;
  }

  return JSON.stringify({
    ...parsed,
    guardObservation: observation,
  });
}