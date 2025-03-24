import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mower } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, CloudUpload } from "lucide-react";

interface MaintenanceModalProps {
  mower: Mower;
  onClose: () => void;
}

const maintenanceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(5, "Notes must be at least 5 characters"),
  maintenanceType: z.string(),
  fileUrl: z.string().optional(),
  caption: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export default function MaintenanceModal({ mower, onClose }: MaintenanceModalProps) {
  const [fileSelected, setFileSelected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      title: "",
      content: "",
      maintenanceType: "blade_replacement",
      fileUrl: "",
      caption: "",
    },
  });
  
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: MaintenanceFormValues) => {
      const res = await apiRequest("POST", `/api/mowers/${mower.id}/notes`, {
        title: `${data.maintenanceType}: ${data.title}`,
        content: data.content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mowers/${mower.id}/notes`] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes/recent"] });
      toast({
        title: "Maintenance Added",
        description: "Maintenance record has been saved successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save maintenance record",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: MaintenanceFormValues) => {
    mutate(data);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileSelected(true);
      // In a real app, we would upload the file here
      // For now just update the UI
    }
  };
  
  const maintenanceTypes = [
    { value: "blade_replacement", label: "Blade Replacement" },
    { value: "battery_check", label: "Battery Check" },
    { value: "wheel_cleaning", label: "Wheel Cleaning" },
    { value: "firmware_update", label: "Firmware Update" },
    { value: "general_inspection", label: "General Inspection" },
    { value: "other", label: "Other" },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mower Maintenance - {mower.name}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="maintenanceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select maintenance type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maintenanceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter maintenance details..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Attach Files</FormLabel>
              <div 
                className="mt-1 border-2 border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <CloudUpload className="h-10 w-10 text-muted-foreground mb-2" />
                {fileSelected ? (
                  <p className="text-sm text-muted-foreground">File selected (upload not implemented)</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-1">
                      Drag files here or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max file size: 10MB
                    </p>
                  </>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Maintenance Record"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
