import type { ApiResponse, AuthorApplyRequest } from '@/types/api';
import type { AuthorProfile, AuthorStats } from '@/types/models';
import apiClient from './client';

export async function applyAsAuthor(data: AuthorApplyRequest): Promise<AuthorProfile> {
  const res = await apiClient.post<ApiResponse<AuthorProfile>>('/authors/apply', data);
  return res.data.data;
}

export async function getMyProfile(): Promise<AuthorProfile> {
  const res = await apiClient.get<ApiResponse<AuthorProfile>>('/authors/me');
  return res.data.data;
}

export async function updateMyProfile(data: Partial<AuthorProfile>): Promise<AuthorProfile> {
  const res = await apiClient.put<ApiResponse<AuthorProfile>>('/authors/me', data);
  return res.data.data;
}

export async function getMyStats(): Promise<AuthorStats> {
  const res = await apiClient.get<ApiResponse<AuthorStats>>('/authors/me/stats');
  return res.data.data;
}

/** Une oeuvre, vue par ce qu'elle attire. */
export interface LigneDAudience {
  id: string;
  titre: string;
  /** Visites de la page sur la fenetre observee. */
  visites: number;
  /** Personnes distinctes qui en ont lu au moins une page. */
  lecteurs: number;
  pagesLues: number;
}

export interface Audience {
  jours: number;
  livres: LigneDAudience[];
  /** Les series : visites de leur page, lectures de leurs episodes. */
  series: LigneDAudience[];
  sources: Array<{ source: string; visites: number }>;
  parJour: Array<{ jour: string; visites: number }>;
}

/**
 * Ce que le public fait des oeuvres de l'auteur.
 *
 * A cote de `getMyStats`, qui parle d'argent : les deux ne repondent pas a la
 * meme question. L'une dit ce qu'on a gagne, l'autre ce qui attire — et c'est
 * la seconde qui decide ou remettre de la publicite.
 */
export async function getMyAudience(jours = 30): Promise<Audience> {
  const res = await apiClient.get<ApiResponse<Audience>>(`/authors/me/audience?jours=${jours}`);
  return res.data.data;
}

export interface WithdrawalRequest {
  id: string;
  amount: string;
  paymentMethod: string;
  phoneNumber: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}

export interface Earnings {
  balance: number;
  transactions: import('@/types/models').Transaction[];
  /** Demandes en cours. Leur montant est deja retire du solde. */
  withdrawals: WithdrawalRequest[];
  /** Montant minimal d'une demande, en FCFA. */
  withdrawalThreshold: number;
}

export async function getMyEarnings(): Promise<Earnings> {
  const res = await apiClient.get<
    ApiResponse<{
      balance: string;
      transactions: import('@/types/models').Transaction[];
      withdrawals?: WithdrawalRequest[];
      withdrawalThreshold?: number;
    }>
  >('/authors/me/earnings');
  const d = res.data.data;
  return {
    balance: Number(d.balance),
    transactions: d.transactions || [],
    withdrawals: d.withdrawals || [],
    withdrawalThreshold: d.withdrawalThreshold ?? 0,
  };
}

export async function requestWithdrawal(data: {
  amount: number;
  method: string;
  phoneNumber: string;
}): Promise<WithdrawalRequest> {
  const res = await apiClient.post<ApiResponse<WithdrawalRequest>>('/authors/me/withdraw', data);
  return res.data.data;
}
