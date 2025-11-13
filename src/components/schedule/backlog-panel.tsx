"use client";

import * as React from "react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  backlogItemCreateSchema,
  type BacklogItemResponse,
} from "@/lib/schemas/backlog-item";
import {
  useBacklog,
  useCreateBacklogItem,
  useDeleteBacklogItem,
  useUpdateBacklogItem,
} from "@/hooks/use-schedule";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type BacklogFormValues = z.input<typeof backlogItemCreateSchema>;
type BacklogFormSubmitValues = z.output<typeof backlogItemCreateSchema>;

export function BacklogPanel() {
  const { data: backlogItems, isLoading } = useBacklog();
  const createItem = useCreateBacklogItem();
  const updateItem = useUpdateBacklogItem();
  const deleteItem = useDeleteBacklogItem();

  const form = useForm<BacklogFormValues, unknown, BacklogFormSubmitValues>({
    resolver: zodResolver(backlogItemCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      isCompleted: false,
    } satisfies BacklogFormValues,
  });

  const onSubmit = async (values: BacklogFormSubmitValues) => {
    await createItem.mutateAsync(values);
    form.reset({
      title: "",
      description: "",
      category: "",
      isCompleted: false,
    } satisfies BacklogFormValues);
  };

  const handleToggleComplete = async (item: BacklogItemResponse) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        input: { isCompleted: !item.isCompleted },
      });
    } catch (error) {
      toast({
        title: "Unable to update backlog item",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (item: BacklogItemResponse) => {
    const confirmed = window.confirm(`Delete "${item.title}"?`);
    if (!confirmed) return;
    await deleteItem.mutateAsync(item.id);
  };

  const openItems = backlogItems?.filter((item) => !item.isCompleted) ?? [];
  const completedItems = backlogItems?.filter((item) => item.isCompleted) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backlog</CardTitle>
        <CardDescription>
          Keep track of tasks to tackle soon. Categorize them once and mark them
          complete when done.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Deep clean office" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => {
                const { value, ...rest } = field;
                return (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional context"
                        {...rest}
                        value={value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => {
                const { value, ...rest } = field;
                return (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Home, web dev, personal"
                        {...rest}
                        value={value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={createItem.isPending}
            >
              {createItem.isPending ? "Adding..." : "Add to backlog"}
            </Button>
          </form>
        </Form>

        <div className="space-y-4">
          <SectionHeading title="Next up" />
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : openItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Backlog is clear. Add tasks above to keep track.
              </p>
            ) : (
              openItems.map((item) => (
                <BacklogRow
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggleComplete(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))
            )}
          </div>
        </div>

        {completedItems.length > 0 && (
          <div className="space-y-3">
            <SectionHeading title="Completed" />
            <div className="space-y-3">
              {completedItems.map((item) => (
                <BacklogRow
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggleComplete(item)}
                  onDelete={() => handleDelete(item)}
                  completed
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h3 className="text-sm font-semibold uppercase tracking-tight text-muted-foreground">{title}</h3>;
}

type BacklogRowProps = {
  item: BacklogItemResponse;
  onToggle: () => void;
  onDelete: () => void;
  completed?: boolean;
};

function BacklogRow({ item, onToggle, onDelete, completed = false }: BacklogRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="flex flex-1 items-start gap-3">
        <Checkbox
          checked={item.isCompleted}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className={cn("text-sm font-medium", completed && "line-through text-muted-foreground")}>
              {item.title}
            </p>
            {item.category && (
              <Badge variant="outline">{item.category}</Badge>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        Remove
      </Button>
    </div>
  );
}

