# UI/UX Design Guidelines: Appointment Booking System

## 1. Design Philosophy & Healthcare Experience Principles

The user interface of the **Appointment Booking System** is engineered to instill **calmness, trust, clarity, and efficiency**. Medical appointment platforms serve users who may be stressed, unwell, or in urgent need of care. Therefore, cognitive friction must be minimized through clear typography, accessible contrast, predictable workflows, and immediate feedback.

### Core UX Principles
1. **Calm Confidence**: A professional medical-blue aesthetic paired with clean whitespace evokes competence, hygiene, and reliability.
2. **Predictable Navigation**: Users must always understand where they are, what step they are performing, and how to go back or edit choices.
3. **Frictionless Scheduling**: Doctor search, slot selection, and confirmation must be achievable in under 3 minutes with zero ambiguity around dates or time zones.
4. **Accessible by Default**: Full compliance with WCAG 2.1 AA standards—high contrast ratios, keyboard navigability, and clear screen reader semantics.

---

## 2. Color Palette & Theming (Healthcare Blue)

The design system uses a curated **Healthcare Blue** palette using CSS variables compatible with Tailwind CSS v4 and shadcn/ui.

### 2.1. Color Tokens Table

| Token | Light Mode (Hex / HSL) | Dark Mode (Hex / HSL) | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **`--primary`** | `#0284c7` (Sky 600) | `#38bdf8` (Sky 400) | Primary CTA buttons, active calendar dates, key highlights |
| **`--primary-foreground`** | `#ffffff` | `#0f172a` (Slate 900) | High-contrast text on primary buttons |
| **`--secondary`** | `#f0f9ff` (Sky 50) | `#082f49` (Sky 950) | Secondary buttons, subtle badges, active tab background |
| **`--secondary-foreground`** | `#0369a1` (Sky 700) | `#e0f2fe` (Sky 100) | Text on secondary elements |
| **`--background`** | `#ffffff` | `#090d16` (Slate 950) | Base application background |
| **`--foreground`** | `#0f172a` (Slate 900) | `#f8fafc` (Slate 50) | Primary body text and headings |
| **`--card`** | `#ffffff` | `#111827` (Gray 900) | Doctor cards, dashboard metric widgets |
| **`--muted`** | `#f1f5f9` (Slate 100) | `#1e293b` (Slate 800) | Inactive tabs, disabled slot buttons, skeleton loaders |
| **`--muted-foreground`** | `#64748b` (Slate 500) | `#94a3b8` (Slate 400) | Secondary metadata, timestamps, helper descriptions |
| **`--border`** | `#e2e8f0` (Slate 200) | `#334155` (Slate 700) | Card borders, table dividers, input borders |
| **`--ring`** | `#0284c7` | `#38bdf8` | Focus ring outline for accessible keyboard navigation |

### 2.2. Semantic Feedback Colors

| State | Color Token | Hex Code | Semantic Meaning |
| :--- | :--- | :--- | :--- |
| **Success** | `emerald-600` | `#059669` | Confirmed bookings, verified doctor badges, saved changes |
| **Warning** | `amber-500` | `#d97706` | Pending approvals, cancellation policy warnings, expiring slots |
| **Destructive / Error** | `rose-600` | `#e11d48` | Failed bookings, cancelled visits, validation errors |
| **Info** | `blue-600` | `#2563eb` | Informational callouts, clinic policy banners |

---

## 3. Typography System

The application utilizes a clean, humanist sans-serif font family (**Inter** or **Geist**) to maximize legibility across medical terminology and numerical dates/times.

```css
/* Typography Scale Sample */
--font-sans: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

| Element | Tailwind Class | Size / Line-Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1** | `text-3xl sm:text-4xl` | 32px / 40px | Bold (`font-bold`) | `-0.02em` | Page titles, major dashboard headers |
| **H2** | `text-2xl` | 24px / 32px | Semibold (`font-semibold`) | `-0.01em` | Section headers, modal titles |
| **H3** | `text-lg sm:text-xl` | 20px / 28px | Semibold (`font-semibold`) | Normal | Card headings, doctor profile names |
| **Body Large** | `text-base` | 16px / 24px | Regular (`font-normal`) | Normal | Intro paragraphs, consultation summaries |
| **Body Normal** | `text-sm` | 14px / 20px | Regular (`font-normal`) | Normal | Default UI text, table rows, form inputs |
| **Caption / Small** | `text-xs` | 12px / 16px | Medium (`font-medium`) | `+0.01em` | Timestamp labels, badges, helper hints |

---

## 4. shadcn/ui Component Guidelines

The component system is based on **shadcn/ui** primitives built over Radix UI. Components are directly owned in `src/components/ui/` and styled with Tailwind utility classes.

### 4.1. Button Conventions
- **`default` (Primary)**: `bg-primary text-primary-foreground hover:bg-primary/90` — Reserved for the primary action on a page (e.g., "Confirm Booking", "Save Schedule"). Only one primary button per screen section.
- **`outline` / `secondary`**: `border border-input hover:bg-accent` — Secondary choices (e.g., "Cancel", "Back", "View Profile").
- **`destructive`**: `bg-destructive text-destructive-foreground hover:bg-destructive/90` — High-impact actions (e.g., "Cancel Appointment", "Delete Schedule").
- **`ghost`**: Icon buttons in navigation bars, table action menus, or dismiss triggers.

### 4.2. Appointment Slot Buttons
Time slot selectors are critical interactive elements. They must clearly communicate availability state:
- **Available Slot**: `border border-primary/30 bg-primary/5 hover:bg-primary hover:text-white transition-colors py-2 px-3 rounded-md text-sm font-medium`
- **Selected Slot**: `bg-primary text-primary-foreground shadow-sm ring-2 ring-primary ring-offset-2`
- **Booked / Disabled Slot**: `bg-muted text-muted-foreground/40 line-through cursor-not-allowed border-dashed`

### 4.3. Badges for Appointment Status
- **`CONFIRMED`**: `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400`
- **`PENDING`**: `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400`
- **`COMPLETED`**: `bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400`
- **`CANCELLED`**: `bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400`

---

## 5. Iconography (Lucide React)

Icons are sourced from **Lucide React** to maintain visual consistency.

### 5.1. Icon Standards
- **Size**: Default icon size is `size-4` (16px) for inline text and buttons, `size-5` (20px) for navigation items, and `size-8` (32px) for empty state illustrations.
- **Stroke Width**: Standardized at `stroke-[1.75]` or `stroke-2` for crisp rendering.
- **Accessibility**: Purely decorative icons must have `aria-hidden="true"`. Standalone icon buttons must include an accessible `aria-label` or `<span className="sr-only">Label</span>`.

### 5.2. Semantic Icon Mapping

| Use Case | Icon Component | Meaning / Context |
| :--- | :--- | :--- |
| **Medical / Clinical** | `<Stethoscope />` | Doctor specialty, clinical services |
| **Calendar / Date** | `<Calendar />` | Date selection, schedule overview |
| **Clock / Time** | `<Clock />` | Slot times, consultation duration |
| **Doctor Verified** | `<BadgeCheck />` | Admin-verified healthcare practitioner |
| **Rating / Feedback** | `<Star />` | Patient review rating (filled or outline) |
| **Location / Clinic** | `<MapPin />` | Physical clinic address |
| **Telehealth / Video** | `<Video />` | Virtual consultation link |
| **Alert / Warning** | `<AlertTriangle />` | Important notices, cancellation warnings |
| **Success Check** | `<CheckCircle2 />` | Booking completed, success indicator |
| **User Profile** | `<User />` | Patient/Doctor avatar placeholder |

---

## 6. Responsive Design & Breakpoints

The application adheres to a strict **mobile-first** development philosophy. Patients frequently book appointments on smartphones while traveling or away from a desk.

### 6.1. Tailwind Breakpoints
- **`sm` (640px)**: Compact mobile to landscape phone / small tablet.
- **`md` (768px)**: Tablet devices; transition from mobile drawer to side-by-side grids.
- **`lg` (1024px)**: Standard desktop / laptop view.
- **`xl` (1280px)**: High-resolution widescreen dashboards.

### 6.2. Key Responsive Behaviors
- **Booking Interface**:
  - *Mobile (`< 768px`)*: Two-step wizard or bottom Drawer sheet. Step 1: Select date. Step 2: Scroll through horizontal chip bar or 2-column grid of time slots.
  - *Desktop (`>= 768px`)*: Side-by-side layout. Left column: Interactive calendar. Right column: Dynamic time slot grid and consultation summary.
- **Navigation**:
  - *Mobile*: Bottom navigation bar (Patient) or collapsible slide-out Sheet drawer.
  - *Desktop*: Sticky top navigation bar with user profile dropdown and persistent notification bell.

---

## 7. Form Validation & User Input UX

All forms are orchestrated using **React Hook Form** paired with **Zod** validation schemas via `@hookform/resolvers/zod`.

### 7.1. Form UX Best Practices
1. **Validate on Blur & Submit**: Validate individual fields on blur (`mode: 'onBlur'`) so users are not interrupted while typing, then revalidate on change once an error is flagged.
2. **Clear Error Placement**: Render error messages directly beneath the corresponding input field in red (`text-destructive text-xs mt-1`).
3. **Accessible Form Associations**: Every input must have an associated `<Label htmlFor="field-id">` and use `aria-invalid={!!errors.field}` and `aria-describedby="field-id-error"`.

### 7.2. Canonical Form Implementation Example

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const bookingSchema = z.object({
  reasonForVisit: z.string().min(5, "Please describe the reason for your visit in at least 5 characters.").max(300),
  patientPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid international phone number."),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function AppointmentBookingForm({ onSubmitAction, isPending }: { onSubmitAction: (v: BookingFormValues) => void; isPending: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmitAction)} className="space-y-4">
      <div>
        <Label htmlFor="patientPhone">Contact Phone Number</Label>
        <Input
          id="patientPhone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          {...register("patientPhone")}
          aria-invalid={!!errors.patientPhone}
        />
        {errors.patientPhone && (
          <p className="text-xs text-destructive mt-1">{errors.patientPhone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="reasonForVisit">Reason for Visit</Label>
        <Input
          id="reasonForVisit"
          placeholder="e.g. Routine checkup, chronic back pain"
          {...register("reasonForVisit")}
          aria-invalid={!!errors.reasonForVisit}
        />
        {errors.reasonForVisit && (
          <p className="text-xs text-destructive mt-1">{errors.reasonForVisit.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Confirming Slot..." : "Complete Booking"}
      </Button>
    </form>
  );
}
```

---

## 8. Toast Notifications (Sonner)

System feedback is communicated via **Sonner** toasts positioned at `top-right` on desktop and `bottom-center` on mobile devices.

### 8.1. Toast Notification Standards
- **Success (`toast.success`)**: Confirms completed actions. Keep text under 10 words (e.g., *"Appointment confirmed for Oct 29 at 10:00 AM"*). Auto-dismiss after 4 seconds.
- **Error (`toast.error`)**: Informs the user of failures with actionable advice (e.g., *"Slot unavailable: Please select an alternative time"*). Auto-dismiss after 6 seconds.
- **Promise / Loading (`toast.promise`)**: Used during async Server Actions to eliminate perceived latency:

```tsx
import { toast } from "sonner";

toast.promise(bookAppointmentAction(slotData), {
  loading: "Reserving your appointment slot...",
  success: (data) => `Appointment ${data.referenceCode} confirmed!`,
  error: (err) => err.message || "Failed to reserve appointment. Please try again.",
});
```

---

## 9. Loading States, Skeletons & Empty States

### 9.1. Loading States
- **Button Loaders**: When an action is pending, buttons must transition into a disabled state displaying an animated `<Loader2 className="mr-2 h-4 w-4 animate-spin" />` icon to prevent duplicate submissions.
- **Skeleton Placeholders**: Replace raw spinners on page loads with UI Skeletons (`<Skeleton className="h-28 w-full rounded-xl" />`) matching the dimensions of doctor cards, calendar grids, or appointment lists.

### 9.2. Empty States
When queries return no data (e.g., "No doctors found", "No upcoming appointments"), render a dedicated empty state:
- An illustrative icon (e.g., `<CalendarX className="size-12 text-muted-foreground" />`).
- A clear heading (e.g., *"No Upcoming Appointments"*).
- Explanatory copy (e.g., *"You do not have any scheduled consultations. Browse our specialist directory to book a visit."*).
- A prominent CTA button (e.g., *"Find a Doctor"*).

---

## 10. Error Handling & Recovery UX

1. **Inline Field Errors**: Display immediately beneath the affected field with high-contrast text and red borders.
2. **Global Server Action Errors**: Caught at the form or component level and surfaced via Sonner error toasts without page reloads.
3. **Route Error Boundaries (`error.tsx`)**: Catch unexpected runtime exceptions gracefully. Render a friendly apology screen with an explicit *"Try Again"* action button and a link back to `/dashboard`.
4. **Not Found Boundary (`not-found.tsx`)**: Displays when an invalid doctor profile or appointment ID is requested, providing a quick search bar to return to the active directory.
