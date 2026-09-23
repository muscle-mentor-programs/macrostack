// The database returns effective capabilities; presets here explain the roles in UI.
export const teamRoles = {
 organization_admin: {label:'Chain administrator', description:'Company settings, teams and approved resources across the chain.'},
 regional: {label:'Regional manager', description:'Teams and operations across selected stores.'},
 manager: {label:'Store manager', description:'Store operations, employees and customer care.'},
 specialist: {label:'Nutrition specialist', description:'Customer nutrition, consultations, progress and conversations.'},
 associate: {label:'Associate', description:'Customer onboarding, follow-ups, approved resources and conversations.'},
 reviewer: {label:'Read-only reviewer', description:'View authorized records and reports without changing them.'},
 operator: {label:'Franchise administrator', description:'Administration across stores belonging to this operator.'},
};
export const capabilityLabels = {
 customers:'View customer records', customer_write:'Update customer records', nutrition:'Edit nutrition and meal plans',
 chat:'Communicate with customers', resources:'Share approved resources', resource_manage:'Create store resources',
 team:'Manage employees', reports:'View reports', exports:'Export customer records', delete_customer:'Delete customers',
 billing:'Manage billing', branding:'Manage company branding',
};
export const roleName = member => teamRoles[member.access_role || member.role]?.label || member.role;
