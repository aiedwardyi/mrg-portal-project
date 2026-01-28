-- Create members table for storing investor information
CREATE TABLE public.members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    available_balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
    purchase_round TEXT NOT NULL DEFAULT 'Seed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own member record
CREATE POLICY "Users can view their own member record"
ON public.members
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy: Users can update their own member record (for linking user_id)
CREATE POLICY "Users can update their own record"
ON public.members
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index on email for faster lookups
CREATE INDEX idx_members_email ON public.members(email);

-- Create index on user_id for faster lookups
CREATE INDEX idx_members_user_id ON public.members(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to link member record to auth user on signup/login
CREATE OR REPLACE FUNCTION public.link_member_on_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.members
    SET user_id = NEW.id
    WHERE email = NEW.email AND user_id IS NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-link member when user is created in auth
CREATE TRIGGER on_auth_user_created_link_member
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.link_member_on_auth();