"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { favoriteEventCreateSchema } from "@/lib/schemas/favorite-event";
import { useCreateFavorite } from "@/hooks/use-schedule";

type FavoriteFormValues = z.input<typeof favoriteEventCreateSchema>;
type FavoriteFormSubmitValues = z.output<typeof favoriteEventCreateSchema>;

export function CreateFavoriteDialog() {
  const [open, setOpen] = React.useState(false);
  const createFavorite = useCreateFavorite();

  const form = useForm<FavoriteFormValues, unknown, FavoriteFormSubmitValues>({
    resolver: zodResolver(favoriteEventCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: undefined,
      endTime: undefined,
    } satisfies FavoriteFormValues,
  });

  const onSubmit = async (values: FavoriteFormSubmitValues) => {
    await createFavorite.mutateAsync(values);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add favorite</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Favorite</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 pt-2"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Morning routine"
                      {...field}
                      maxLength={120}
                    />
                  </FormControl>
                  <FormDescription>
                    Give your favorite event a descriptive name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => {
                const { value, onChange, ...rest } = field;
                return (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details..."
                        {...rest}
                        value={value ?? ""}
                        onChange={(e) => {
                          onChange(e.target.value || undefined);
                        }}
                        maxLength={500}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Add any notes or reminders for this favorite.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => {
                  const { value, onChange, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Start time (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...rest}
                          value={value ?? ""}
                          onChange={(e) => {
                            onChange(e.target.value || undefined);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Use 24-hour format (HH:MM)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => {
                  const { value, onChange, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>End time (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...rest}
                          value={value ?? ""}
                          onChange={(e) => {
                            onChange(e.target.value || undefined);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Use 24-hour format (HH:MM)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createFavorite.isPending}>
                {createFavorite.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

