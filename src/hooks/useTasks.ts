import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface Task {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category: string;
  is_completed: boolean;
  created_at: string;
  user_id: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error loading tasks",
        description: "Failed to load your tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: CreateTaskData) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [...prev, data]);
      toast({
        title: "Task created",
        description: "Your task has been added successfully."
      });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error creating task",
        description: "Failed to create your task. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => 
        prev.map(task => task.id === id ? data : task)
      );

      toast({
        title: "Task updated",
        description: "Your task has been updated successfully."
      });

      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error updating task",
        description: "Failed to update your task. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error deleting task",
        description: "Failed to delete your task. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    await updateTask(id, { is_completed: !task.is_completed });
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    fetchTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as Task]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => 
              prev.map(task => 
                task.id === payload.new.id ? payload.new as Task : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    refetch: fetchTasks
  };
};