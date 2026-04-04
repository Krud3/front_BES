import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { useEditName } from "../model/use-edit-name";

export function EditNameForm() {
  const { editName, currentName, loading } = useEditName();
  const [value, setValue] = useState(currentName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await editName(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="display-name" className="text-sm font-medium">
        Display name
      </label>
      <div className="flex gap-2">
        <input
          id="display-name"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Your name"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || value.trim() === currentName}>
          {loading ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
