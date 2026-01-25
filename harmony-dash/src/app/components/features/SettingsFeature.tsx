import { User, Bell, Lock, Palette, Globe } from "lucide-react";

export function SettingsFeature() {
  return (
    <div className="space-y-6">
      <p className="text-gray-700 font-serif italic">
        Customize your voice agent dashboard and manage your profile settings.
      </p>

      <div className="space-y-4">
        {/* Profile Section */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black">
          <div className="flex items-center gap-4 mb-4">
            <User className="w-6 h-6 text-black" />
            <h3 className="font-serif text-black">Profile Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="font-serif text-gray-600 block mb-1">Full Name</label>
              <input 
                type="text" 
                defaultValue="John Doe" 
                className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-serif"
              />
            </div>
            <div>
              <label className="font-serif text-gray-600 block mb-1">Email Address</label>
              <input 
                type="email" 
                defaultValue="john.doe@example.com" 
                className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-serif"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black">
          <div className="flex items-center gap-4 mb-4">
            <Bell className="w-6 h-6 text-black" />
            <h3 className="font-serif text-black">Notifications</h3>
          </div>
          <div className="space-y-3">
            {[
              "Email notifications for high-risk alerts",
              "SMS notifications for transaction approvals",
              "Weekly performance summary",
              "System maintenance updates",
            ].map((option, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-black rounded border-2 border-black" />
                <span className="font-serif text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black">
          <div className="flex items-center gap-4 mb-4">
            <Lock className="w-6 h-6 text-black" />
            <h3 className="font-serif text-black">Security</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-serif transition-colors">
              Change Password
            </button>
            <button className="w-full px-4 py-2 bg-white hover:bg-gray-50 text-black border-2 border-black rounded-lg font-serif transition-colors">
              Enable Two-Factor Authentication
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black">
          <div className="flex items-center gap-4 mb-4">
            <Palette className="w-6 h-6 text-black" />
            <h3 className="font-serif text-black">Appearance</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Light", color: "bg-white" },
              { label: "Dark", color: "bg-black" },
              { label: "Auto", color: "bg-gradient-to-br from-white to-black" },
            ].map((theme, idx) => (
              <button 
                key={idx}
                className={`${theme.color} border-2 border-black rounded-lg p-4 text-center hover:opacity-80 transition-opacity`}
              >
                <div className={`font-serif ${idx === 1 ? "text-white" : "text-black"}`}>
                  {theme.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white p-6 rounded-2xl border-2 border-black">
          <div className="flex items-center gap-4 mb-4">
            <Globe className="w-6 h-6 text-black" />
            <h3 className="font-serif text-black">Language & Region</h3>
          </div>
          <select className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-serif">
            <option>English (US)</option>
            <option>English (UK)</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
          </select>
        </div>
      </div>
    </div>
  );
}
