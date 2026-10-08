export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'head' | 'marketer';
  department: string;
  is_active: boolean;
  is_superuser?: boolean;
}

export interface Company {
  id: number;
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legal_address: string;
  actual_address: string;
  industry: string;
  region: string;
  client_type: string;
  manager: number | null;
  manager_name?: string;
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreate {
  name: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legal_address?: string;
  actual_address?: string;
  industry?: string;
  region?: string;
  client_type?: string;
  source?: string;
  notes?: string;
}

export interface Contact {
  id: number;
  company: number;
  company_name?: string;
  full_name: string;
  position: string;
  phone_mobile: string;
  phone_work: string;
  email: string;
  telegram: string;
  whatsapp: string;
  role_in_deal: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  company: number;
  full_name: string;
  position?: string;
  phone_mobile?: string;
  phone_work?: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
  role_in_deal?: string;
  notes?: string;
}

export interface Deal {
  id: number;
  title: string;
  company: number;
  company_name?: string;
  lead: number | null;
  amount: string;
  currency: string;
  stage: string;
  probability: number;
  close_date: string | null;
  manager: number | null;
  manager_name?: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DealCreate {
  title: string;
  company: number;
  amount?: string;
  currency?: string;
  stage?: string;
  probability?: number;
  close_date?: string;
  description?: string;
}

export interface Task {
  id: number;
  title: string;
  type: string;
  priority: string;
  status: string;
  deadline: string | null;
  user: number;
  user_name?: string;
  deal: number | null;
  deal_title?: string;
  company: number | null;
  contact: number | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  type?: string;
  priority?: string;
  status?: string;
  deadline?: string | null;
  deal?: number | null;
  company?: number | null;
  contact?: number | null;
  description?: string;
}

export interface Lead {
  id: number;
  title: string;
  source: string;
  status: string;
  contact: number | null;
  contact_name?: string;
  company_name: string;
  assigned_to: number | null;
  assigned_to_name?: string;
  rejection_reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface LeadCreate {
  title: string;
  source?: string;
  status?: string;
  contact?: number | null;
  company_name?: string;
  assigned_to?: number | null;
  notes?: string;
}

export interface Activity {
  id: number;
  object_type: string;
  object_id: number;
  action: string;
  user: number | null;
  user_name?: string;
  comment: string;
  meta: any;
  timestamp: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}