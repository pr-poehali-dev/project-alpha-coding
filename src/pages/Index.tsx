import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Icon from "@/components/ui/icon"

export default function LaunchPadPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [count, setCount] = useState(1247)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setCount((c) => c + 1)
    setIsSubmitted(true)
    setIsLoading(false)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="CheckCircle2" className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Вы в списке!</h2>
              <p className="text-muted-foreground">
                Спасибо, {name}. Мы напишем на <span className="font-medium text-foreground">{email}</span>, как только запустимся.
              </p>
              <Button onClick={() => setIsSubmitted(false)} variant="outline" className="mt-2">
                Добавить другой email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Rocket" className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">LaunchPad</h1>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">О нас</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Возможности</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Контакты</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Скоро запуск
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Что-то <span className="text-primary">большое</span> уже в пути
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Оставьте email и станьте одним из первых, кто получит ранний доступ в день запуска.
            </p>
          </div>

          <Card className="border-2 border-border shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">Получить ранний доступ</CardTitle>
              <CardDescription className="text-center">Без спама — только письмо о запуске</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Icon name="User" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
                <div className="relative">
                  <Icon name="Mail" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="hello@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Отправка..." : "Забронировать место"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Icon name="Users" className="h-4 w-4 text-primary" />
            Уже <span className="font-semibold text-foreground">{count.toLocaleString("ru-RU")}</span> человек в листе ожидания
          </div>
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-muted-foreground">© 2025 LaunchPad. Все права защищены.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Конфиденциальность</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Условия</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
