import { useAuth } from './../../frontend/src/entities/users/hooks/useAuth';
import 'express-session'
import { User } from './users/entities/user.entity'

declare module 'express-session' {
    interface SessionData {
        userId?: string,
        user?: User
    }
}