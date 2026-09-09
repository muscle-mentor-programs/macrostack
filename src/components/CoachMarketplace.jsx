import Marketplace from '../pages/Marketplace'

export default function CoachMarketplace({ onClose }) {
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-bg"><Marketplace onBack={onClose} /></div>
}
