import React from 'react';
import { LogOut, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface AddAccountBtnProps {
    className?: string;
}

export const AddAccountBtn = ({ className }: AddAccountBtnProps) => {
  const {  addAccount, isLoading } = useAuthStore();

    return (
        <button 
          className={className}
          onClick={() => addAccount()} 
          disabled={isLoading}
          title="Add Account"
        >
          <Plus size={20} />
        </button>
    )
}
