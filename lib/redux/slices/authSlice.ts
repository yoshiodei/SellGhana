// import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
// // import type { User } from "@/lib/context/auth-context"

// interface AuthState {
//   user: User | null
//   loading: boolean
// }

// const initialState: AuthState = {
//   user: null,
//   loading: false,
// }

// const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     setUser: (state, action: PayloadAction<User | null>) => {
//       state.user = action.payload
//     },
//     setLoading: (state, action: PayloadAction<boolean>) => {
//       state.loading = action.payload
//     },
//   },
// })

// export const { setUser, setLoading } = authSlice.actions
// export default authSlice.reducer
