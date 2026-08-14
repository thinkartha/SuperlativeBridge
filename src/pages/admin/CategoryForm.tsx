import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/api";

const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    status: "Active",
    icon: "",
    slug: "",
    color: "",
  });

  const { data: categories, isLoading } = useCategories();
  const category = categories?.find((c) => c.id === id);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name ?? "",
        status: category.status ?? "Active",
        icon: category.icon ?? "",
        slug: category.slug ?? "",
        color: category.color ?? "",
      });
    }
  }, [category]);

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    try {
      if (isEdit && id) {
        await updateCategory.mutateAsync({ id, ...form });
        toast({
          title: "Category updated!",
          description: `"${form.name}" has been updated.`,
        });
      } else {
        await createCategory.mutateAsync(form);
        toast({
          title: "Category created!",
          description: `"${form.name}" has been added.`,
        });
      }
      navigate("/admin/categories");
    } catch (e) {
      toast({
        title: "Failed to save category",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Button
          variant="ghost"
          className="gap-1 mb-4 text-muted-foreground"
          onClick={() => navigate("/admin/categories")}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Categories
        </Button>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {isEdit ? "Edit Category" : "Add New Category"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEdit
            ? "Update this course category"
            : "Create a new course category"}
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-8 space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Category Name *</Label>
          <Input
            placeholder="e.g. Cybersecurity"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => update("status", v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/categories")}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Cancel
        </Button>
        <Button
          variant="hero"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="gap-1"
        >
          <Check className="w-4 h-4" />{" "}
          {isEdit ? "Save Changes" : "Create Category"}
        </Button>
      </div>
    </div>
  );
};

export default CategoryForm;
