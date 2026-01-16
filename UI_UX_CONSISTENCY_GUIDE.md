# UI/UX Consistency Guide
**All pages must follow these patterns exactly**

## 🎨 Color Scheme

### Backgrounds
- **Main background:** `bg-zinc-950` (all dashboard pages)
- **Card background:** `bg-zinc-900` with `border border-zinc-800`
- **Alert/Warning background:** `bg-red-500/10` with `border border-red-500/20`
- **Success background:** `bg-emerald-500/10` with `border border-emerald-500/20`

### Text Colors
- **Primary text:** `text-white` (headings, important text)
- **Secondary text:** `text-zinc-400` (body text, descriptions)
- **Muted text:** `text-zinc-500` (labels, timestamps)
- **Losses/Errors:** `text-red-400` (warnings, losses)
- **Wins/Success:** `text-emerald-400` (success, wins)
- **Links:** `text-zinc-400 hover:text-white`

### Accent Colors
- **Losses (urgent):** Red (`text-red-400`, `bg-red-500`, `border-red-500/20`)
- **Wins (secondary):** Emerald (`text-emerald-400`, `bg-emerald-500`, `border-emerald-500/20`)
- **Primary CTA:** `bg-red-500 hover:bg-red-600` (for urgent actions)
- **Secondary CTA:** `bg-emerald-500 hover:bg-emerald-600` (for positive actions)

## 📐 Page Structure

### Standard Page Layout
```tsx
<div className="min-h-screen bg-zinc-950 p-6">
  <div className="max-w-6xl mx-auto"> {/* or max-w-4xl for narrower pages */}
    {/* Back link (if not main dashboard) */}
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
      <ArrowLeft className="w-4 h-4" />
      Back to dashboard
    </Link>

    {/* Page header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">Page Title</h1>
      <p className="text-xl text-zinc-400">Page description</p>
    </div>

    {/* Content */}
    ...
  </div>
</div>
```

### Card Pattern
```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
  <h2 className="text-lg font-semibold text-white mb-4">Card Title</h2>
  {/* Content */}
</div>
```

## 🔘 Button Styles

### Primary Button (Urgent Actions)
```tsx
<button className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-zinc-700 text-white font-semibold rounded-xl transition-colors">
  Action Text
  <ArrowRight className="w-5 h-5" />
</button>
```

### Secondary Button (Positive Actions)
```tsx
<button className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors">
  Action Text
</button>
```

### Outline Button
```tsx
<button className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-colors">
  Action Text
</button>
```

## 📊 Loading States

### Standard Loading
```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
  <Loader2 className="w-8 h-8 text-red-400 animate-spin mx-auto mb-4" />
  <p className="text-zinc-400">Loading message...</p>
</div>
```

## ⚠️ Error States

### Standard Error Banner
```tsx
<div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
  <AlertTriangle className="w-5 h-5 text-red-400" />
  <p className="text-red-400">Error message</p>
</div>
```

## 🎯 Empty States (No Blank States!)

### Compelling CTA Instead of Empty State
```tsx
<div className="bg-gradient-to-br from-red-950/30 to-zinc-900 border-2 border-red-500/30 rounded-xl p-12 text-center">
  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
  <h3 className="text-2xl font-bold text-white mb-2">Urgent Headline</h3>
  <p className="text-zinc-400 mb-6">Compelling description</p>
  <button className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors">
    Take Action
    <ArrowRight className="w-5 h-5" />
  </button>
</div>
```

## 📝 Typography

### Headings
- **H1:** `text-3xl font-bold text-white mb-2`
- **H2:** `text-2xl font-bold text-white mb-4`
- **H3:** `text-xl font-semibold text-white mb-3`
- **H4:** `text-lg font-semibold text-white mb-2`

### Body Text
- **Primary:** `text-white`
- **Secondary:** `text-zinc-400`
- **Muted:** `text-zinc-500`

## 🔗 Navigation Patterns

### Back Links (for sub-pages)
```tsx
<Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
  <ArrowLeft className="w-4 h-4" />
  Back to dashboard
</Link>
```

### Breadcrumbs (if needed)
```tsx
<div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
  <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
  <span>/</span>
  <span className="text-zinc-400">Current Page</span>
</div>
```

## 🎨 Badge Styles

### Status Badges
```tsx
{/* Critical/Urgent */}
<span className="px-3 py-1 bg-red-500/10 text-red-400 text-sm font-medium rounded-full border border-red-500/20">
  Critical
</span>

{/* Success/Positive */}
<span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-full border border-emerald-500/20">
  Success
</span>

{/* Info */}
<span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-sm font-medium rounded-full">
  Info
</span>
```

## 📱 Responsive Patterns

### Standard Container
```tsx
<div className="max-w-6xl mx-auto px-6">
  {/* Content */}
</div>
```

### Grid Layouts
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

## ✅ Consistency Checklist

For every page, verify:
- [ ] Uses `bg-zinc-950` for main background
- [ ] Uses `bg-zinc-900 border border-zinc-800` for cards
- [ ] Uses consistent text colors (`text-white`, `text-zinc-400`, `text-zinc-500`)
- [ ] Uses consistent button styles
- [ ] Uses consistent spacing (`p-6`, `mb-6`, `mb-8`)
- [ ] Uses consistent rounded corners (`rounded-xl`)
- [ ] Has proper loading states
- [ ] Has proper error states
- [ ] No blank states (use compelling CTAs instead)
- [ ] Consistent typography hierarchy
- [ ] Consistent icon sizes (`w-4 h-4` for small, `w-5 h-5` for medium, `w-6 h-6` for large)

