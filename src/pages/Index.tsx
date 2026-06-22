import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Mail, User } from "lucide-react"

export default function LaunchPadPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitted(true)
    setIsLoading(false)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Вы в списке!</h2>
              <p className="text-muted-foreground">
                Спасибо за регистрацию, {name}. Мы уведомим вас на {email}, когда запустимся.
              </p>
              <Button onClick={() => setIsSubmitted(false)} variant="outline" className="mt-4">
                Добавить другой email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">LaunchPad</h1>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="hover:text-accent transition-colors">
              О нас
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              Функции
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              Контакты
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Скоро <span className="text-primary">большой</span> запуск
            </h2>
            <p className="text-lg text-muted-foreground">
              Будьте первыми, кто откроет будущее. Присоединяйтесь и получите ранний доступ.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center text-secondary">Ранний доступ</CardTitle>
              <CardDescription className="text-center">Узнайте первыми о запуске</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="hello@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-accent hover:text-accent-foreground transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Отправка..." : "Получить доступ"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Уже <span className="font-semibold text-secondary">1 247</span> человек ожидают запуска
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card py-8 px-6 mt-16">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <p className="text-muted-foreground">2025 LaunchPad. Все права защищены.</p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-secondary transition-colors">
              Политика конфиденциальности
            </a>
            <a href="#" className="text-muted-foreground hover:text-secondary transition-colors">
              Условия использования
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
