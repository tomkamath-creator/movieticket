import Dexie, { type Table } from 'dexie';
import type { Ticket } from '../types';

export class BucketPassDatabase extends Dexie {
  tickets!: Table<Ticket, string>;

  constructor() {
    super('BucketPassVault');
    this.version(1).stores({
      tickets: 'id, title, cinema, format, rating, dateWatched, createdAt',
    });
  }
}

export const db = new BucketPassDatabase();

// Initialize database: cleanly removes any mock/sample tickets from previous launches
export async function initDatabase(): Promise<Ticket[]> {
  try {
    // Delete any mock sample tickets so the user only sees their own genuine tickets
    const sampleKeys = await db.tickets
      .filter((t) => t.id.startsWith('sample-'))
      .primaryKeys();

    if (sampleKeys.length > 0) {
      await db.tickets.bulkDelete(sampleKeys);
    }
  } catch (err) {
    console.warn('Error purging sample tickets:', err);
  }

  return db.tickets.orderBy('dateWatched').reverse().toArray();
}

// Fetch all tickets sorted by dateWatched descending
export async function getTickets(): Promise<Ticket[]> {
  return db.tickets.orderBy('dateWatched').reverse().toArray();
}

// Save or insert a new ticket
export async function saveTicket(ticket: Ticket): Promise<string> {
  await db.tickets.put(ticket);
  return ticket.id;
}

// Update existing ticket
export async function updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
  await db.tickets.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

// Delete ticket
export async function deleteTicket(id: string): Promise<void> {
  await db.tickets.delete(id);
}

// Export Vault to JSON file
export async function exportVault(): Promise<string> {
  const allTickets = await db.tickets.toArray();
  const exportPayload = {
    version: 1,
    appName: 'BucketPass',
    exportedAt: new Date().toISOString(),
    ticketCount: allTickets.length,
    tickets: allTickets,
  };
  return JSON.stringify(exportPayload, null, 2);
}

// Import Vault from JSON string
export async function importVault(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.tickets || !Array.isArray(data.tickets)) {
      return { success: false, count: 0, error: 'Invalid vault backup: missing tickets array.' };
    }
    await db.tickets.bulkPut(data.tickets);
    return { success: true, count: data.tickets.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown JSON parse error';
    return { success: false, count: 0, error: errorMsg };
  }
}
