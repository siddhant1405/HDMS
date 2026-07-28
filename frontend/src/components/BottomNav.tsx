import { Camera, FileUp, Home, Search, UserPlus } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/">
        <Home size={20} /> Home
      </NavLink>
      <NavLink to="/patients/new">
        <UserPlus size={20} /> Add
      </NavLink>
      <NavLink to="/search">
        <Search size={20} /> Search
      </NavLink>
      <NavLink to="/search?next=photo">
        <Camera size={20} /> Photo
      </NavLink>
      <NavLink to="/search?next=document">
        <FileUp size={20} /> Upload
      </NavLink>
    </nav>
  )
}
