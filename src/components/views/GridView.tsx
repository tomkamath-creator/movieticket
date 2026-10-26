import React from 'react';
import type { Ticket } from '../../types';
import { TicketStubCard } from '../TicketStubCard';
import { Film } from 'lucide-react';

interface GridViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const GridView: React.FC<GridViewProps> = ({ tickets, onSelectTicket }) => {
  if (tickets.length === 0) {
    return (
      <div className="py-20 text-center">
        <Film className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h3 className="text-lg font-bold text-slate-300">No tickets found</h3>
        <p className="text-sm text-slate-500 mt-1">
          Try clearing your filters or add a ticket screenshot to your vault.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-4">
      {tickets.map((ticket) => (
        <TicketStubCard
          key={ticket.id}
          ticket={ticket}
          onClick={() => onSelectTicket(ticket)}
        />
      ))}
    </div>
  );
};
