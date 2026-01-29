export enum Role {
  READER = 'READER',
  AUTHOR = 'AUTHOR',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum AuthorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum BookStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

export enum TransactionType {
  SALE = 'SALE',
  WITHDRAWAL = 'WITHDRAWAL',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorProfile {
  id: string;
  userId: string;
  user?: User;
  penName: string;
  bio: string;
  photoUrl?: string;
  website?: string;
  twitter?: string;
  facebook?: string;
  status: AuthorStatus;
  mtnNumber?: string;
  omNumber?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface Book {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  fileUrl?: string;
  price: number;
  status: BookStatus;
  rejectionReason?: string;
  authorId: string;
  categories?: Category[];
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  bookId?: string;
  book?: Book;
  createdAt: string;
}

export interface AuthorStats {
  totalBooks: number;
  totalSales: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
}

export interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  phoneNumber: string;
  status: WithdrawalStatus;
  createdAt: string;
}
