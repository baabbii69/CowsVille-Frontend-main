/**
 * Standardizes date formatting to dd/mm/yy across the application.
 * @param date The date to format (string, Date, null, or undefined)
 * @returns Formatted date string in dd/mm/yy format or "N/A"
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "N/A";
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};
