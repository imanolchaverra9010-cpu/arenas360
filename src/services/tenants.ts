import { apiGet } from '@/services/api';

export type TenantPublicItem = {
  id: number;
  nombre: string;
};

export type InvitacionPreview = {
  valid: boolean;
  tenant_id: number;
  tenant_nombre: string;
  rol: string;
  email: string;
};

export async function fetchPublicTenants() {
  const data = await apiGet<{ items: TenantPublicItem[] }>('/api/tenants/public', false);
  return data.items;
}

export async function previewInvitation(token: string, email: string) {
  const params = new URLSearchParams({
    token: token.trim(),
    email: email.trim().toLowerCase(),
  });
  return apiGet<InvitacionPreview>(`/api/auth/invitations/preview?${params.toString()}`, false);
}
