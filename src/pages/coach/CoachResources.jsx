import useStore from '../../store'
import useIsSuperadmin from '../../hooks/useIsSuperadmin'
import ScrambleText from '../../components/ScrambleText'
import ThemeToggle from '../../components/ThemeToggle'
import { BookOpen, ClipboardList, User, CreditCard, MessageSquare, Users, Utensils, ArrowRight } from 'lucide-react'
export default function CoachResources({ account = false }) {
  const {setActivePage,setActiveRole,logout,currentUser,portalMode,setPortalMode}=useStore()
  const admin=useIsSuperadmin()
  const items=account ? [
    ['profile','Profile & settings','Your coaching profile and preferences',User],
    ['upgrade','Subscription','Manage your coaching plan',CreditCard],
    ['forms','Forms & check-ins','Create questionnaires for your clients',ClipboardList],
    ['marketplace','Marketplace','Manage your public coaching presence',Users],
    ['feedback','Feedback','Share suggestions and report issues',MessageSquare],
    ...(admin?[['coaches','Coaches','Manage coach accounts',Users],['billing','Billing','Manage billing access',CreditCard]]:[]),
  ] : [['foods','Food library','Find and manage foods for your meal plans',Utensils],['clients','Meal plans','Choose a client to create, edit, or reuse a meal plan',BookOpen],['forms','Forms & check-ins','Build and assign your coaching questionnaires',ClipboardList]]
  return <section className="coach-resource-page" data-resource-tone={account ? 'account' : 'library'}><header className="coach-resource-header app-page-gutter glass-panel accent-line anim-fade-in-down"><h1 aria-label={account ? 'Settings' : 'Library'}><ScrambleText key={account ? 'account' : 'library'} text={account ? 'SETTINGS' : 'LIBRARY'} duration={800} /></h1><p>{account?'Your settings and supporting tools.':'Everything you use to support your clients.'}</p></header><div className="coach-resource-content"><div className="coach-resource-grid">{items.map(([id,title,description,Icon])=><button key={id} onClick={()=>setActivePage(id)}><Icon size={22}/><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={18}/></button>)}</div>{account&&<section className="coach-account-settings"><h2>Preferences</h2><div><span>Appearance</span><ThemeToggle /></div><button onClick={()=>setActiveRole(null)}>Switch to member app</button>{currentUser?.role==='superadmin'&&<button onClick={()=>setPortalMode(portalMode==='superadmin'?'coach':'superadmin')}>Switch to {portalMode==='superadmin'?'coach':'superadmin'} portal</button>}<button onClick={logout}>Log out</button></section>}</div></section>
}
