import axios from 'axios'
import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL as string

async function headers() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchStats() {
  const { data } = await axios.get(`${BASE}/api/admin/stats`, { headers: await headers() })
  return data
}

export async function fetchUsers() {
  const { data } = await axios.get(`${BASE}/api/admin/users`, { headers: await headers() })
  return data
}

export async function fetchApplications(status?: string) {
  const params = status ? { status } : {}
  const { data } = await axios.get(`${BASE}/api/applications`, { headers: await headers(), params })
  return data
}

export async function fetchBookings() {
  const { data } = await axios.get(`${BASE}/api/admin/bookings`, { headers: await headers() })
  return data
}

export async function fetchProfessionals() {
  const { data } = await axios.get(`${BASE}/api/professionals`, { headers: await headers() })
  return data
}

export async function approveApp(id: string, notes?: string) {
  const { data } = await axios.patch(`${BASE}/api/applications/${id}/approve`, { notes }, { headers: await headers() })
  return data
}

export async function rejectApp(id: string, notes: string) {
  const { data } = await axios.patch(`${BASE}/api/applications/${id}/reject`, { notes }, { headers: await headers() })
  return data
}

export async function activateApp(id: string) {
  const { data } = await axios.patch(`${BASE}/api/applications/${id}/activate`, {}, { headers: await headers() })
  return data
}

export async function toggleProfessional(id: string) {
  const { data } = await axios.patch(`${BASE}/api/admin/professionals/${id}/toggle`, {}, { headers: await headers() })
  return data
}

export async function removeProfessional(id: string) {
  await axios.delete(`${BASE}/api/admin/professionals/${id}`, { headers: await headers() })
}
