'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { CornerDownLeft, Moon, Sun, Plus, ArrowUpDown } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { visibleNav } from './nav'

/* ============================================================================
   Command palette (⌘K / Ctrl+K)
   ----------------------------------------------------------------------------
   The fastest path to any of ~20 admin surfaces plus the handful of actions
   operators repeat all day. Every nav item is reachable in two keystrokes, in
   Arabic or by its English alias.
   ========================================================================== */

type Ctx = { open: boolean; setOpen: (v: boolean) => void }
const PaletteCtx = React.createContext<Ctx | null>(null)

export function useCommandPalette() {
  const ctx = React.useContext(PaletteCtx)
  if (!ctx) throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>')
  return ctx
}

export function CommandPaletteProvider({
  role,
  children,
}: {
  role?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const groups = React.useMemo(() => visibleNav(role), [role])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const go = React.useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const value = React.useMemo(() => ({ open, setOpen }), [open])

  return (
    <PaletteCtx.Provider value={value}>
      {children}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="لوحة الأوامر"
        description="ابحث عن صفحة أو نفّذ إجراءً"
      >
        <CommandInput placeholder="اذهب إلى… أو ابحث عن إجراء" />
        <CommandList className="max-h-[380px]">
          <CommandEmpty>
            <span className="text-[13px] text-text-muted">لا توجد نتائج مطابقة</span>
          </CommandEmpty>

          <CommandGroup heading="إجراءات">
            <PaletteItem
              icon={<Plus className="size-4" />}
              label="إنشاء منتج جديد"
              shortcut="N"
              onSelect={() => go('/admin/products-advanced/new')}
            />
            <PaletteItem
              icon={<ArrowUpDown className="size-4" />}
              label="استيراد منتجات"
              onSelect={() => go('/admin/products-advanced/import')}
            />
            <PaletteItem
              icon={resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              label={resolvedTheme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
              onSelect={() => {
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                setOpen(false)
              }}
            />
          </CommandGroup>

          <CommandSeparator />

          {groups.map((group) => (
            <CommandGroup key={group.id} heading={group.label ?? 'عام'}>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <React.Fragment key={item.href}>
                    <PaletteItem
                      icon={<Icon className="size-4" />}
                      label={item.label}
                      keywords={item.keywords}
                      onSelect={() => go(item.href)}
                    />
                    {item.children?.map((c) => (
                      <PaletteItem
                        key={c.href}
                        icon={<CornerDownLeft className="size-4 opacity-50" />}
                        label={`${item.label} › ${c.label}`}
                        onSelect={() => go(c.href)}
                      />
                    ))}
                  </React.Fragment>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </PaletteCtx.Provider>
  )
}

function PaletteItem({
  icon,
  label,
  shortcut,
  keywords,
  onSelect,
}: {
  icon: React.ReactNode
  label: string
  shortcut?: string
  keywords?: string[]
  onSelect: () => void
}) {
  return (
    <CommandItem
      onSelect={onSelect}
      keywords={keywords}
      className="gap-2.5 !py-2 text-[13px]"
    >
      <span className="text-text-faint [&_svg]:!size-4">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <kbd className="rounded-[3px] border border-border px-1 font-mono text-[10px] text-text-faint">
          {shortcut}
        </kbd>
      )}
    </CommandItem>
  )
}
