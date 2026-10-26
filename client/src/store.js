import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from './api.js';

const saved = JSON.parse(localStorage.getItem('ks_auth') || 'null');

export const authenticate = createAsyncThunk('auth/authenticate', async ({ mode, ...body }, { rejectWithValue }) => {
  try { return await api(`/auth/${mode}`, { method: 'POST', body }); }
  catch (e) { return rejectWithValue(e.message); }
});

const auth = createSlice({
  name: 'auth',
  initialState: { token: saved?.token || null, user: saved?.user || null, status: 'idle', error: null },
  reducers: {
    logout(s) { s.token = null; s.user = null; localStorage.removeItem('ks_auth'); }
  },
  extraReducers: b => b
    .addCase(authenticate.pending, s => { s.status = 'loading'; s.error = null; })
    .addCase(authenticate.fulfilled, (s, { payload }) => {
      s.status = 'idle'; s.token = payload.token; s.user = payload.user;
      localStorage.setItem('ks_auth', JSON.stringify(payload));
    })
    .addCase(authenticate.rejected, (s, { payload }) => { s.status = 'idle'; s.error = payload; })
});

export const fetchListings = createAsyncThunk('listings/fetch', params =>
  api(`/listings?${new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null))}`));
export const createListing = createAsyncThunk('listings/create', async (body, { getState, rejectWithValue }) => {
  try { return await api('/listings', { method: 'POST', body, token: getState().auth.token }); }
  catch (e) { return rejectWithValue(e.message); }
});
export const removeListing = createAsyncThunk('listings/remove', async (id, { getState }) => {
  await api(`/listings/${id}`, { method: 'DELETE', token: getState().auth.token });
  return id;
});

const listings = createSlice({
  name: 'listings',
  initialState: { items: [], page: 1, pages: 1, status: 'idle' },
  extraReducers: b => b
    .addCase(fetchListings.pending, s => { s.status = 'loading'; })
    .addCase(fetchListings.fulfilled, (s, { payload }) => { s.status = 'idle'; s.items = payload.items; s.page = payload.page; s.pages = payload.pages; })
    .addCase(fetchListings.rejected, s => { s.status = 'error'; })
    .addCase(createListing.fulfilled, (s, { payload }) => { s.items.unshift(payload); })
    .addCase(removeListing.fulfilled, (s, { payload }) => { s.items = s.items.filter(l => l._id !== payload); })
});

export const { logout } = auth.actions;
export default configureStore({ reducer: { auth: auth.reducer, listings: listings.reducer } });
