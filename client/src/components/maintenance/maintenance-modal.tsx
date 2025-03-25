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
      console.log("Regular mutation - mower ID:", mower.id);
      
      // Make sure we have a valid mower ID
      if (!mower.id) {
        throw new Error("Cannot save maintenance record: Mower not registered in database");
      }
      
      // Build FormData if file is selected
      if (fileSelected && fileInputRef.current?.files?.length) {
        console.log("Uploading file with maintenance record");
        const formData = new FormData();
        formData.append('title', `${data.maintenanceType}: ${data.title}`);
        formData.append('content', data.content);
        formData.append('file', fileInputRef.current.files[0]);
        
        try {
          const res = await fetch(`/api/mowers/${mower.id}/notes`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error("Error response:", errorText);
            throw new Error(`Failed to upload file: ${res.status} ${errorText}`);
          }
          
          return res.json();
        } catch (error) {
          console.error("File upload error:", error);
          throw error;
        }
      }
      
      // No file, just send JSON
      console.log("Sending JSON maintenance record for mower ID:", mower.id);
      const payload = {
        title: `${data.maintenanceType}: ${data.title}`,
        content: data.content,
      };
      
      try {
        const res = await apiRequest(`/api/mowers/${mower.id}/notes`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        
        return res;
      } catch (error) {
        console.error("JSON submission error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      if (mower.id) {
        console.log("Invalidating queries for mower ID:", mower.id);
        queryClient.invalidateQueries({ queryKey: [`/api/mowers/${mower.id}/notes`] });
        queryClient.invalidateQueries({ queryKey: ["/api/notes/recent"] });
      }
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
  
  // Additional mutation for registered mowers
  const saveNoteForRegisteredMower = useMutation({
    mutationFn: async ({ mowerId, data }: { mowerId: string | number, data: MaintenanceFormValues }) => {
      // Build payload
      const payload = {
        title: `${data.maintenanceType}: ${data.title}`,
        content: data.content,
      };
      
      // Send request
      const res = await apiRequest(`/api/mowers/${mowerId}/notes`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/mowers/${variables.mowerId}/notes`] });
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
    }
  });

  // Effect to register mower if it has an automower ID but no database ID
  useEffect(() => {
    if (mower.automowerId && !mower.id && !isMowerRegistered) {
      console.log("Attempting to register mower:", mower.automowerId);
      // Register the mower with the backend - only pass the automowerId
      registerMower.mutate({ id: mower.automowerId } as any);

      // Update the registration state
      setIsMowerRegistered(true);
    }
  }, [mower, isMowerRegistered, registerMower]);

  const onSubmit = async (data: MaintenanceFormValues) => {
    console.log("Submitting maintenance record for mower:", mower);
    
    // If the mower isn't registered yet and has an automower ID, register it
    if (!mower.id && mower.automowerId) {
      try {
        console.log("Registering mower before adding maintenance record");
        // Register the mower first - only pass the automowerId
        const registeredMower = await registerMower.mutateAsync({ id: mower.automowerId } as any);
        console.log("Mower registered successfully:", registeredMower);
        
        // Update registration state
        setIsMowerRegistered(true);
        
        // Update the mower object with data from registration
        queryClient.invalidateQueries({ queryKey: ["/api/mowers"] });
        
        // Now the mower should have an ID from the registration
        if (registeredMower && registeredMower.id) {
          console.log("Using registered mower ID for maintenance:", registeredMower.id);
          // Use the additional mutation to save the note
          saveNoteForRegisteredMower.mutate({ mowerId: registeredMower.id, data });
        } else {
          toast({
            title: "Error",
            description: "Failed to get mower ID after registration. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error registering mower before maintenance:", error);
        toast({
          title: "Registration Error",
          description: "Failed to register mower. Please try again.",
          variant: "destructive",
        });
      }
    } else if (mower.id) {
      // Mower already has an ID, proceed with maintenance record
      console.log("Using existing mower ID for maintenance:", mower.id);
      mutate(data);
    } else {
      console.error("Cannot add maintenance: No valid mower ID", mower);
      toast({
        title: "Error",
        description: "Cannot add maintenance record: No valid mower ID",
        variant: "destructive",
      });
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
          <p className="text-sm text-muted-foreground">
            Record maintenance activities to keep track of your mower's service history.
          </p>
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
