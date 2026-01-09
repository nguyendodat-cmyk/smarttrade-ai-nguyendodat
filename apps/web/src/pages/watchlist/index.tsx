import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  ListPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WatchlistTable } from '@/components/watchlist/watchlist-table'
import {
  useWatchlistStore,
  WATCHLIST_COLORS,
} from '@/stores/watchlist-store'

export function WatchlistPage() {
  const {
    watchlists,
    activeWatchlistId,
    setActiveWatchlist,
    createWatchlist,
    deleteWatchlist,
    renameWatchlist,
    setWatchlistColor,
    moveStock,
  } = useWatchlistStore()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newWatchlistName, setNewWatchlistName] = useState('')
  const [newWatchlistColor, setNewWatchlistColor] = useState(WATCHLIST_COLORS[0])

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null)

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId)

  const handleCreateWatchlist = () => {
    if (newWatchlistName.trim()) {
      createWatchlist(newWatchlistName.trim(), newWatchlistColor)
      setNewWatchlistName('')
      setNewWatchlistColor(WATCHLIST_COLORS[watchlists.length % WATCHLIST_COLORS.length])
      setIsCreateDialogOpen(false)
    }
  }

  const handleRenameWatchlist = () => {
    if (renameTarget && renameTarget.name.trim()) {
      renameWatchlist(renameTarget.id, renameTarget.name.trim())
      setRenameTarget(null)
      setIsRenameDialogOpen(false)
    }
  }

  const handleMoveStock = (symbol: string, toWatchlistId: string) => {
    if (activeWatchlistId) {
      moveStock(activeWatchlistId, toWatchlistId, symbol)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watchlist Pro</h1>
          <p className="text-foreground-muted">
            Quản lý danh sách theo dõi cổ phiếu
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo danh sách mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo danh sách mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên danh sách</label>
                <Input
                  placeholder="VD: Cổ phiếu tăng trưởng"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWatchlist()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Màu sắc</label>
                <div className="flex flex-wrap gap-2">
                  {WATCHLIST_COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        newWatchlistColor === color && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewWatchlistColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateWatchlist} disabled={!newWatchlistName.trim()}>
                Tạo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Watchlist Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {watchlists.map((watchlist) => (
          <div key={watchlist.id} className="relative group">
            <Button
              variant={activeWatchlistId === watchlist.id ? 'secondary' : 'outline'}
              className={cn(
                'pr-8 transition-all',
                activeWatchlistId === watchlist.id && 'ring-2 ring-offset-2'
              )}
              style={{
                ['--tw-ring-color' as string]: watchlist.color,
              }}
              onClick={() => setActiveWatchlist(watchlist.id)}
            >
              <span
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: watchlist.color }}
              />
              {watchlist.name}
              <Badge variant="secondary" className="ml-2 text-xs">
                {watchlist.stocks.length}
              </Badge>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setRenameTarget({ id: watchlist.id, name: watchlist.name })
                    setIsRenameDialogOpen(true)
                  }}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Đổi tên
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-xs opacity-50">
                  Đổi màu
                </DropdownMenuItem>
                {WATCHLIST_COLORS.map((color) => (
                  <DropdownMenuItem
                    key={color}
                    onClick={() => setWatchlistColor(watchlist.id, color)}
                  >
                    <span
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    {watchlist.color === color && '✓'}
                  </DropdownMenuItem>
                ))}
                {watchlists.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-danger focus:text-danger"
                      onClick={() => deleteWatchlist(watchlist.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa danh sách
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <ListPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Active Watchlist Content */}
      {activeWatchlist && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeWatchlist.color }}
                />
                <CardTitle>{activeWatchlist.name}</CardTitle>
                <Badge variant="outline">{activeWatchlist.stocks.length} mã</Badge>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Thêm mã
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <WatchlistTable watchlist={activeWatchlist} onMoveStock={handleMoveStock} />
          </CardContent>
        </Card>
      )}

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên danh sách</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameTarget?.name || ''}
              onChange={(e) =>
                setRenameTarget((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
              onKeyDown={(e) => e.key === 'Enter' && handleRenameWatchlist()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleRenameWatchlist}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
