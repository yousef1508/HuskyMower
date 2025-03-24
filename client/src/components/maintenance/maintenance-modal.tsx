import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mower } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRegisterAutomower } from "@/hooks/use-automower";
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
import { X, CloudUpload, Loader2 } from "lucide-react";

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
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isMowerRegistered, setIsMowerRegistered] = useState(!!mower.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const registerMower = useRegisterAutomower();
  
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
      // Build FormData if file is selected
      if (fileSelected && fileInputRef.current?.files?.length) {
        const formData = new FormData();
        formData.append('title', `${data.maintenanceType}: ${data.title}`);
        formData.append('content', data.content);
        formData.append('file', fileInputRef.current.files[0]);
        
        const res = await fetch(`/api/mowers/${mower.id}/notes`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!res.ok) throw new Error('Failed to upload file');
        return res.json();
      }
      
      // No file, just send JSON
      const payload = {
        title: `${data.maintenanceType}: ${data.title}`,
        content: data.content,
      };
      
      const res = await apiRequest(`/api/mowers/${mower.id}/notes`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      return res;
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
    onError: (error) => {
      console.error("Error saving maintenance record:", error);
      toast({
        title: "Error",
        description: "Failed to save maintenance record. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Effect to register mower if it has an automower ID but no database ID
  useEffect(() => {
    if (mower.automowerId && !mower.id && !isMowerRegistered) {
      // Register the mower with the backend
      registerMower.mutate({ ...mower });

      // Update the registration state
      setIsMowerRegistered(true);
    }
  }, [mower, isMowerRegistered, registerMower]);

  const onSubmit = async (data: MaintenanceFormValues) => {
    // If the mower isn't registered yet and has an automower ID, register it
    if (!isMowerRegistered && mower.automowerId) {
      try {
        // Register the mower first
        await registerMower.mutateAsync({ ...mower });
        // Update registration state
        setIsMowerRegistered(true);
        // Update the mower object with data from registration
        queryClient.invalidateQueries({ queryKey: ["/api/mowers"] });
        // Wait a moment for the queries to update
        setTimeout(() => mutate(data), 500);
      } catch (error) {
        console.error("Error registering mower before maintenance:", error);
        toast({
          title: "Registration Error",
          description: "Failed to register mower. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Mower already registered, proceed with maintenance record
      mutate(data);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileSelected(true);
      setFileName(files[0].name);
      
      // Simulate upload for preview if needed
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
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
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : fileSelected ? (
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-muted-foreground">{fileName}</p>
                    <p className="text-xs text-green-500 mt-1">Ready to upload</p>
                  </div>
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
                  accept="image/*,.pdf,.doc,.docx"
                  ref={fileInputRef}
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
