-- Enable realtime for tickets table to get live scan updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;