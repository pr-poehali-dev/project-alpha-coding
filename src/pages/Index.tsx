import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Icon from "@/components/ui/icon"

const API = "https://functions.poehali.dev/aec74d39-e66b-4c90-bf80-cab0122e53b2"

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  fns:   { label: "ФНС",      color: "bg-red-100 text-red-700 border-red-200" },
  fss:   { label: "ФСС/СФР",  color: "bg-orange-100 text-orange-700 border-orange-200" },
  bank:  { label: "Банк",     color: "bg-blue-100 text-blue-700 border-blue-200" },
  other: { label: "Другое",   color: "bg-gray-100 text-gray-700 border-gray-200" },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:      { label: "Новое",    color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  in_work:  { label: "В работе", color: "bg-blue-100 text-blue-700 border-blue-200" },
  answered: { label: "Отвечено", color: "bg-green-100 text-green-700 border-green-200" },
}

interface Company { id: number; name: string; inn: string }
interface Requirement {
  id: number; company_id: number; company_name: string; title: string
  source: string; status: string; pdf_url: string | null; pdf_filename: string | null
  ai_response: string | null; user_response: string | null; created_at: string
}

export default function App() {
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(false)

  const [showAddCompany, setShowAddCompany] = useState(false)
  const [showAddReq, setShowAddReq] = useState(false)
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null)

  const [companyName, setCompanyName] = useState("")
  const [companyInn, setCompanyInn] = useState("")

  const [reqTitle, setReqTitle] = useState("")
  const [reqSource, setReqSource] = useState("fns")
  const [reqFile, setReqFile] = useState<File | null>(null)
  const [reqSaving, setReqSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [editResponse, setEditResponse] = useState("")
  const [savingResponse, setSavingResponse] = useState(false)

  useEffect(() => { fetchCompanies() }, [])

  useEffect(() => {
    if (selectedCompany) fetchRequirements(selectedCompany.id)
    else setRequirements([])
  }, [selectedCompany])

  async function fetchCompanies() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/companies`)
      const data = await res.json()
      setCompanies(data)
      if (data.length > 0) setSelectedCompany(data[0])
    } catch {
      toast({ title: "Ошибка загрузки компаний", variant: "destructive" })
    }
    setLoading(false)
  }

  async function fetchRequirements(companyId: number) {
    try {
      const res = await fetch(`${API}/requirements?company_id=${companyId}`)
      setRequirements(await res.json())
    } catch {
      toast({ title: "Ошибка загрузки требований", variant: "destructive" })
    }
  }

  async function addCompany() {
    if (!companyName.trim()) return
    try {
      const res = await fetch(`${API}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName, inn: companyInn }),
      })
      const data = await res.json()
      setCompanies(prev => [...prev, data])
      setSelectedCompany(data)
      setShowAddCompany(false)
      setCompanyName(""); setCompanyInn("")
      toast({ title: "Компания добавлена" })
    } catch {
      toast({ title: "Ошибка добавления компании", variant: "destructive" })
    }
  }

  async function addRequirement() {
    if (!selectedCompany || !reqTitle.trim()) return
    setReqSaving(true)
    try {
      let pdf_base64 = null
      let pdf_filename = null
      if (reqFile) {
        const buf = await reqFile.arrayBuffer()
        pdf_base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
        pdf_filename = reqFile.name
      }
      const res = await fetch(`${API}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: selectedCompany.id, title: reqTitle, source: reqSource, pdf_base64, pdf_filename }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await fetchRequirements(selectedCompany.id)
      setShowAddReq(false)
      setReqTitle(""); setReqSource("fns"); setReqFile(null)
      toast({ title: "Требование добавлено" })
    } catch (e: unknown) {
      toast({ title: "Ошибка: " + (e instanceof Error ? e.message : String(e)), variant: "destructive" })
    }
    setReqSaving(false)
  }

  async function saveResponse() {
    if (!selectedReq) return
    setSavingResponse(true)
    try {
      await fetch(`${API}/requirements/${selectedReq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_response: editResponse, status: "answered" }),
      })
      setRequirements(prev => prev.map(r =>
        r.id === selectedReq.id ? { ...r, user_response: editResponse, status: "answered" } : r
      ))
      setSelectedReq(prev => prev ? { ...prev, user_response: editResponse, status: "answered" } : prev)
      toast({ title: "Ответ сохранён" })
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" })
    }
    setSavingResponse(false)
  }

  async function updateStatus(req: Requirement, status: string) {
    await fetch(`${API}/requirements/${req.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setRequirements(prev => prev.map(r => r.id === req.id ? { ...r, status } : r))
    if (selectedReq?.id === req.id) setSelectedReq(prev => prev ? { ...prev, status } : prev)
  }

  const newCount = requirements.filter(r => r.status === "new").length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="FileText" className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">БухДок</h1>
              <p className="text-xs text-gray-500">Учёт требований от ФНС, банков и фондов</p>
            </div>
          </div>
          {newCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
              {newCount} новых
            </span>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full flex flex-1 gap-0 px-6 py-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 mr-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Компании</span>
              <button
                onClick={() => setShowAddCompany(true)}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
              >
                <Icon name="Plus" className="h-4 w-4" />
              </button>
            </div>
            <div className="py-1">
              {loading && <div className="px-4 py-3 text-sm text-gray-400">Загрузка...</div>}
              {companies.length === 0 && !loading && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  <Icon name="Building2" className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  Нет компаний
                </div>
              )}
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompany(c)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-2 ${
                    selectedCompany?.id === c.id ? "border-l-primary bg-primary/5" : "border-l-transparent"
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800 truncate">{c.name}</div>
                  {c.inn && <div className="text-xs text-gray-400 mt-0.5">ИНН: {c.inn}</div>}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {!selectedCompany ? (
            <div className="bg-white rounded-xl border border-gray-200 h-64 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Icon name="Building2" className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Выберите или добавьте компанию</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedCompany.name}</h2>
                  {selectedCompany.inn && <p className="text-sm text-gray-500">ИНН: {selectedCompany.inn}</p>}
                </div>
                <Button onClick={() => setShowAddReq(true)} size="sm">
                  <Icon name="Plus" className="h-4 w-4 mr-1" />
                  Добавить требование
                </Button>
              </div>

              {requirements.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 h-48 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Icon name="Inbox" className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">Требований пока нет</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {requirements.map(req => {
                    const src = SOURCE_LABELS[req.source] || SOURCE_LABELS.other
                    const st = STATUS_LABELS[req.status] || STATUS_LABELS.new
                    return (
                      <Card key={req.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => { setSelectedReq(req); setEditResponse(req.user_response || "") }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{req.title}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString("ru-RU")}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${src.color}`}>{src.label}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>{st.label}</span>
                              {req.pdf_url && <Icon name="Paperclip" className="h-3.5 w-3.5 text-gray-400" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Модалка: добавить компанию */}
      <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Новая компания</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Название компании *" value={companyName} onChange={e => setCompanyName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCompany()} />
            <Input placeholder="ИНН (необязательно)" value={companyInn} onChange={e => setCompanyInn(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCompany(false)}>Отмена</Button>
            <Button onClick={addCompany} disabled={!companyName.trim()}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модалка: добавить требование */}
      <Dialog open={showAddReq} onOpenChange={setShowAddReq}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Новое требование</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Название / суть требования *" value={reqTitle} onChange={e => setReqTitle(e.target.value)} />
            <Select value={reqSource} onValueChange={setReqSource}>
              <SelectTrigger><SelectValue placeholder="Источник" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fns">ФНС (налоговая)</SelectItem>
                <SelectItem value="fss">ФСС / СФР</SelectItem>
                <SelectItem value="bank">Банк</SelectItem>
                <SelectItem value="other">Другое</SelectItem>
              </SelectContent>
            </Select>
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {reqFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                  <Icon name="FileText" className="h-4 w-4 text-primary" />
                  {reqFile.name}
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  <Icon name="Upload" className="h-5 w-5 mx-auto mb-1 text-gray-300" />
                  Прикрепить PDF (необязательно)
                </div>
              )}
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => setReqFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddReq(false)}>Отмена</Button>
            <Button onClick={addRequirement} disabled={!reqTitle.trim() || reqSaving}>
              {reqSaving ? "Сохранение..." : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модалка: просмотр требования */}
      <Dialog open={!!selectedReq} onOpenChange={v => !v && setSelectedReq(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedReq && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{selectedReq.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const src = SOURCE_LABELS[selectedReq.source] || SOURCE_LABELS.other
                    const st = STATUS_LABELS[selectedReq.status] || STATUS_LABELS.new
                    return (
                      <>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${src.color}`}>{src.label}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-gray-400">{new Date(selectedReq.created_at).toLocaleDateString("ru-RU")}</span>
                      </>
                    )
                  })()}
                </div>

                {selectedReq.pdf_url && (
                  <a href={selectedReq.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Icon name="FileText" className="h-4 w-4" />
                    {selectedReq.pdf_filename || "Открыть PDF"}
                  </a>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Изменить статус</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_LABELS).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => updateStatus(selectedReq, key)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          selectedReq.status === key
                            ? val.color + " ring-1 ring-offset-1 ring-current"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Ответ на требование</p>
                  <Textarea
                    placeholder="Напишите ответ на требование..."
                    value={editResponse}
                    onChange={e => setEditResponse(e.target.value)}
                    rows={8}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedReq(null)}>Закрыть</Button>
                <Button onClick={saveResponse} disabled={savingResponse}>
                  {savingResponse ? "Сохранение..." : "Сохранить ответ"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
