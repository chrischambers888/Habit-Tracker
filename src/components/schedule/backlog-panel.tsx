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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  useReorderBacklogItems,
} from "@/hooks/use-schedule";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Plus, ChevronUp, ChevronDown, Pencil, Check, ChevronsUpDown } from "lucide-react";

type BacklogFormValues = z.input<typeof backlogItemCreateSchema>;
type BacklogFormSubmitValues = z.output<typeof backlogItemCreateSchema>;

export function BacklogPanel() {
  const { data: backlogItems, isLoading } = useBacklog();
  const createItem = useCreateBacklogItem();
  const updateItem = useUpdateBacklogItem();
  const deleteItem = useDeleteBacklogItem();
  const reorderItems = useReorderBacklogItems();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<BacklogItemResponse | null>(null);
  const [groupByCategory, setGroupByCategory] = React.useState(false);

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
    if (editingItem) {
      await updateItem.mutateAsync({
        id: editingItem.id,
        input: values,
      });
      setEditingItem(null);
    } else {
      await createItem.mutateAsync(values);
    }
    form.reset({
      title: "",
      description: "",
      category: "",
      isCompleted: false,
    } satisfies BacklogFormValues);
    setDialogOpen(false);
  };

  const handleEdit = (item: BacklogItemResponse) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description ?? "",
      category: item.category ?? "",
      isCompleted: item.isCompleted ?? false,
    } satisfies BacklogFormValues);
    setDialogOpen(true);
  };

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!dialogOpen) {
      form.reset({
        title: "",
        description: "",
        category: "",
        isCompleted: false,
      } satisfies BacklogFormValues);
      setEditingItem(null);
    }
  }, [dialogOpen, form]);

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
    await deleteItem.mutateAsync(item.id);
  };

  const handleMoveItem = async (
    itemId: string,
    direction: "up" | "down",
    category?: string
  ) => {
    const openItems = backlogItems?.filter((item) => !item.isCompleted) ?? [];

    // If grouping is enabled and category is provided, only move within that category
    let itemsToReorder = openItems;
    if (groupByCategory && category !== undefined) {
      itemsToReorder = openItems.filter(
        (item) => (item.category || "") === category
      );
    }

    const currentIndex = itemsToReorder.findIndex((item) => item.id === itemId);

    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= itemsToReorder.length) return;

    // Swap items within the category
    const reorderedCategoryItems = [...itemsToReorder];
    [reorderedCategoryItems[currentIndex], reorderedCategoryItems[newIndex]] = [
      reorderedCategoryItems[newIndex],
      reorderedCategoryItems[currentIndex],
    ];

    // If grouping, we need to merge back with other categories
    if (groupByCategory && category !== undefined) {
      const otherItems = openItems.filter(
        (item) => (item.category || "") !== category
      );
      // Merge maintaining the overall order structure
      const allItems = [...openItems];
      const categoryStartIndex = allItems.findIndex(
        (item) => (item.category || "") === category
      );
      // Replace category items in place
      reorderedCategoryItems.forEach((item, idx) => {
        allItems[categoryStartIndex + idx] = item;
      });
      const itemIds = allItems.map((item) => item.id);
      try {
        await reorderItems.mutateAsync(itemIds);
      } catch (error) {
        console.error("Failed to reorder items:", error);
        // Error toast is handled by the mutation
      }
    } else {
      // Not grouping, just swap in the full list
      const reorderedItems = [...openItems];
      const globalCurrentIndex = reorderedItems.findIndex(
        (item) => item.id === itemId
      );
      const globalNewIndex =
        direction === "up" ? globalCurrentIndex - 1 : globalCurrentIndex + 1;
      [reorderedItems[globalCurrentIndex], reorderedItems[globalNewIndex]] = [
        reorderedItems[globalNewIndex],
        reorderedItems[globalCurrentIndex],
      ];
      const itemIds = reorderedItems.map((item) => item.id);
      try {
        await reorderItems.mutateAsync(itemIds);
      } catch (error) {
        console.error("Failed to reorder items:", error);
        // Error toast is handled by the mutation
      }
    }
  };

  const openItems = backlogItems?.filter((item) => !item.isCompleted) ?? [];
  const completedItems = backlogItems?.filter((item) => item.isCompleted) ?? [];

  // Get unique categories from all backlog items
  const existingCategories = React.useMemo(() => {
    const categories = new Set<string>();
    backlogItems?.forEach((item) => {
      if (item.category && item.category.trim()) {
        categories.add(item.category.trim());
      }
    });
    return Array.from(categories).sort();
  }, [backlogItems]);

  // Group items by category if enabled
  const groupedOpenItems = React.useMemo(() => {
    if (!groupByCategory) {
      return { "": openItems };
    }

    const grouped: Record<string, BacklogItemResponse[]> = {};
    openItems.forEach((item) => {
      const category = item.category || "";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  }, [openItems, groupByCategory]);

  const categories = Object.keys(groupedOpenItems).sort((a, b) => {
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b);
  });

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
        <div className="flex items-center justify-between gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Backlog Item" : "Add to Backlog"}
                </DialogTitle>
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
                      const [open, setOpen] = React.useState(false);
                      const { value, onChange } = field;

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Category</FormLabel>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !value && "text-muted-foreground"
                                  )}
                                >
                                  {value
                                    ? existingCategories.find(
                                        (category) => category === value
                                      ) || value
                                    : "Select or type a category..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                              <Command shouldFilter={false}>
                                <CommandInput
                                  placeholder="Search or type new category..."
                                  value={value ?? ""}
                                  onValueChange={(searchValue) => {
                                    onChange(searchValue);
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Enter" &&
                                      value &&
                                      !existingCategories.some(
                                        (cat) =>
                                          cat.toLowerCase() ===
                                          value.toLowerCase()
                                      )
                                    ) {
                                      e.preventDefault();
                                      onChange(value);
                                      setOpen(false);
                                    }
                                  }}
                                />
                                <CommandList>
                                  {value &&
                                    !existingCategories.some(
                                      (cat) =>
                                        cat.toLowerCase() === value.toLowerCase()
                                    ) && (
                                      <CommandGroup>
                                        <CommandItem
                                          value={value}
                                          onSelect={() => {
                                            onChange(value);
                                            setOpen(false);
                                          }}
                                        >
                                          <Check className="mr-2 h-4 w-4 opacity-0" />
                                          Create "{value}"
                                        </CommandItem>
                                      </CommandGroup>
                                    )}
                                  <CommandEmpty>
                                    {value
                                      ? `Press Enter to create "${value}"`
                                      : "No category found."}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {existingCategories
                                      .filter((category) =>
                                        value
                                          ? category
                                              .toLowerCase()
                                              .includes(value.toLowerCase())
                                          : true
                                      )
                                      .map((category) => (
                                        <CommandItem
                                          key={category}
                                          value={category}
                                          onSelect={() => {
                                            onChange(
                                              category === value ? "" : category
                                            );
                                            setOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              value === category
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {category}
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={editingItem ? updateItem.isPending : createItem.isPending}
                    >
                      {editingItem
                        ? updateItem.isPending
                          ? "Updating..."
                          : "Update item"
                        : createItem.isPending
                          ? "Adding..."
                          : "Add to backlog"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2">
            <Switch
              id="group-by-category"
              checked={groupByCategory}
              onCheckedChange={setGroupByCategory}
            />
            <Label
              htmlFor="group-by-category"
              className="text-sm font-normal cursor-pointer"
            >
              Group by category
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeading title="Next up" />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : openItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Backlog is clear. Click "Add Item" to add tasks.
            </p>
          ) : (
            <>
              {groupByCategory ? (
                <div className="space-y-6">
                  {categories.map((category) => {
                    const items = groupedOpenItems[category];
                    return (
                      <div key={category} className="space-y-3">
                        {category && (
                          <h4 className="text-sm font-semibold text-muted-foreground">
                            {category}
                          </h4>
                        )}
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <BacklogRow
                              key={item.id}
                              item={item}
                              onToggle={() => handleToggleComplete(item)}
                              onDelete={() => handleDelete(item)}
                              onEdit={() => handleEdit(item)}
                              onMoveUp={() =>
                                handleMoveItem(item.id, "up", category)
                              }
                              onMoveDown={() =>
                                handleMoveItem(item.id, "down", category)
                              }
                              canMoveUp={index > 0}
                              canMoveDown={index < items.length - 1}
                              hideCategory={groupByCategory}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {openItems.map((item, index) => (
                    <BacklogRow
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggleComplete(item)}
                      onDelete={() => handleDelete(item)}
                      onEdit={() => handleEdit(item)}
                      onMoveUp={() => handleMoveItem(item.id, "up")}
                      onMoveDown={() => handleMoveItem(item.id, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < openItems.length - 1}
                      hideCategory={groupByCategory}
                    />
                  ))}
                </div>
              )}
            </>
          )}
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
                  onEdit={() => handleEdit(item)}
                  completed
                  hideCategory={groupByCategory}
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
  return (
    <h3 className="text-sm font-semibold uppercase tracking-tight text-muted-foreground">
      {title}
    </h3>
  );
}

type BacklogRowProps = {
  item: BacklogItemResponse;
  onToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  completed?: boolean;
  hideCategory?: boolean;
};

function BacklogRow({
  item,
  onToggle,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  completed = false,
  hideCategory = false,
}: BacklogRowProps) {
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
            <p
              className={cn(
                "text-sm font-medium",
                completed && "line-through text-muted-foreground"
              )}
            >
              {item.title}
            </p>
            {item.category && !completed && !hideCategory && (
              <Badge variant="outline">{item.category}</Badge>
            )}
          </div>
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!completed && onMoveUp && onMoveDown && (
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            aria-label="Edit item"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Remove
        </Button>
      </div>
    </div>
  );
}
