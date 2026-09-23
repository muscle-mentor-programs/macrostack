import {createContext,useContext} from 'react';
// Outside the retailer workspace, customer-owned screens keep their own controls.
export const PermissionContext=createContext(null);
export function useRetailPermissions(){return useContext(PermissionContext);}
