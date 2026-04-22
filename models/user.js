// models/user.js

export const ROLES = {
  USER:       'user',
  DEPT_ADMIN: 'department_admin',
  MAIN_ADMIN: 'main_admin',
}

export const userSchema = {
  uid:          '',   // Firebase Auth UID
  name:         '',
  email:        '',
  phone:        '',
  role:         ROLES.USER,
  departmentId: '',   // filled only if role === department_admin
  createdAt:    null,
}

export function isMainAdmin(profile)  { return profile?.role === ROLES.MAIN_ADMIN  }
export function isDeptAdmin(profile)  { return profile?.role === ROLES.DEPT_ADMIN  }
export function isUser(profile)       { return profile?.role === ROLES.USER        }
export function canManageAll(profile) { return isMainAdmin(profile)                }
export function canManageDept(profile, deptId) {
  return isMainAdmin(profile) || (isDeptAdmin(profile) && profile.departmentId === deptId)
}
