import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'

// ── Load persisted user from localStorage on app start ────────────────────────
const savedUser  = JSON.parse(localStorage.getItem('hsp_user') || 'null')
const savedToken = localStorage.getItem('hsp_token') || null

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(credentials)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed.')
    }
  }
)

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async ({ idToken, role = 'Customer' }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.googleLogin({ idToken, role })
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Google login failed.')
    }
  }
)

export const registerCustomer = createAsyncThunk(
  'auth/registerCustomer',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await authApi.registerCustomer(formData)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed.')
    }
  }
)

export const registerProvider = createAsyncThunk(
  'auth/registerProvider',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await authApi.registerProvider(formData)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed.')
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:      savedUser,
    token:     savedToken,
    role:      savedUser?.role || null,
    isLoading: false,
    error:     null,
  },
  reducers: {
    logout(state) {
      state.user  = null
      state.token = null
      state.role  = null
      localStorage.removeItem('hsp_token')
      localStorage.removeItem('hsp_user')
      toast.success('Logged out successfully.')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Helper: handle the fulfilled state the same way for all auth actions
    const handleAuthSuccess = (state, action) => {
      state.isLoading = false
      state.user      = action.payload
      state.token     = action.payload.token
      state.role      = action.payload.role
      state.error     = null
      localStorage.setItem('hsp_token', action.payload.token)
      localStorage.setItem('hsp_user', JSON.stringify(action.payload))
    }

    const handlePending = (state) => {
      state.isLoading = true
      state.error     = null
    }

    const handleRejected = (state, action) => {
      state.isLoading = false
      state.error     = action.payload
    }

    builder
      .addCase(loginUser.pending,         handlePending)
      .addCase(loginUser.fulfilled,       handleAuthSuccess)
      .addCase(loginUser.rejected,        handleRejected)
      .addCase(googleLogin.pending,       handlePending)
      .addCase(googleLogin.fulfilled,     handleAuthSuccess)
      .addCase(googleLogin.rejected,      handleRejected)
      .addCase(registerCustomer.pending,  handlePending)
      .addCase(registerCustomer.fulfilled,handleAuthSuccess)
      .addCase(registerCustomer.rejected, handleRejected)
      .addCase(registerProvider.pending,  handlePending)
      .addCase(registerProvider.fulfilled,handleAuthSuccess)
      .addCase(registerProvider.rejected, handleRejected)
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer