import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';
const STORAGE_KEY = 'task_management_data';

type DbTask = Database['public']['Tables']['tasks']['Row'];
type InsertTask = Database['public']['Tables']['tasks']['Insert'];
type UpdateTask = Database['public']['Tables']['tasks']['Update'];

export interface Task {
  id: string;
  title: string;
  description?: string | null;
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

export function getTasksForUser(userId: string): Task[] {
  // Ambil tasks dari localStorage (atau sumber lain sesuai kebutuhan Anda)
  const savedTasks = localStorage.getItem(STORAGE_KEY);
  if (!savedTasks) return [];
  try {
    const tasks: Task[] = JSON.parse(savedTasks);
    // Filter berdasarkan userId jika Task ada field userId
    return tasks.filter(task => task.user_id === userId);
  } catch (e) {
    console.error('Failed to parse tasks from storage', e);
    return [];
  }
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
      
      // Transform the database response to our Task interface
      const transformedTasks: Task[] = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        start_time: task.start_time,
        end_time: task.end_time,
        category: task.category,
        is_completed: task.is_completed,
        created_at: task.created_at,
        user_id: task.user_id
      }));
      
      setTasks(transformedTasks);
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

      // Transform the response to match our Task interface
      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        start_time: data.start_time,
        end_time: data.end_time,
        category: data.category,
        is_completed: data.is_completed,
        created_at: data.created_at,
        user_id: data.user_id
      };

      setTasks(prev => [...prev, newTask]);
      toast({
        title: "Task created",
        description: "Your task has been added successfully."
      });

      return newTask;
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
      // Convert Task updates to database format
      const dbUpdates: Partial<UpdateTask> = {
        title: updates.title,
        description: updates.description,
        start_time: updates.start_time,
        end_time: updates.end_time,
        category: updates.category,
        is_completed: updates.is_completed
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Transform the response to match our Task interface
      const updatedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        start_time: data.start_time,
        end_time: data.end_time,
        category: data.category,
        is_completed: data.is_completed,
        created_at: data.created_at,
        user_id: data.user_id
      };

      setTasks(prev => 
        prev.map(task => task.id === id ? updatedTask : task)
      );

      toast({
        title: "Task updated",
        description: "Your task has been updated successfully."
      });

      return updatedTask;
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
            const newTask = payload.new as DbTask;
            const transformedTask: Task = {
              id: newTask.id,
              title: newTask.title,
              description: newTask.description,
              start_time: newTask.start_time,
              end_time: newTask.end_time,
              category: newTask.category,
              is_completed: newTask.is_completed,
              created_at: newTask.created_at,
              user_id: newTask.user_id
            };
            setTasks(prev => [...prev, transformedTask]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as DbTask;
            const transformedTask: Task = {
              id: updatedTask.id,
              title: updatedTask.title,
              description: updatedTask.description,
              start_time: updatedTask.start_time,
              end_time: updatedTask.end_time,
              category: updatedTask.category,
              is_completed: updatedTask.is_completed,
              created_at: updatedTask.created_at,
              user_id: updatedTask.user_id
            };
            setTasks(prev => 
              prev.map(task => 
                task.id === transformedTask.id ? transformedTask : task
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