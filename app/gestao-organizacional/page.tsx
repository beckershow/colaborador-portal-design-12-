"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Search, MoreHorizontal, Edit, UserCog, Users as UsersIcon, Archive, Eye, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Usuario = {
  id: string
  nome: string
  email: string
  perfil: "Colaborador" | "Gestor de Time" | "Super Admin"
  times: string[]
  status: "Ativo" | "Inativo" | "Pendente"
  avatar: string
}

type Time = {
  id: string
  nome: string
  gestor: string
  colaboradores: string[]
  status: "Ativo" | "Arquivado"
}

export default function GestaoOrganizacionalPage() {
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialogs de Adicionar/Criar
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false)
  
  // Dialogs de Ações de Usuário
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false)
  const [isMoveTeamDialogOpen, setIsMoveTeamDialogOpen] = useState(false)
  const [isDeactivateUserDialogOpen, setIsDeactivateUserDialogOpen] = useState(false)
  
  // Dialogs de Ações de Time
  const [isViewTeamDialogOpen, setIsViewTeamDialogOpen] = useState(false)
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false)
  const [isChangeManagerDialogOpen, setIsChangeManagerDialogOpen] = useState(false)
  const [isArchiveTeamDialogOpen, setIsArchiveTeamDialogOpen] = useState(false)
  const [isTeamDetailsDialogOpen, setIsTeamDetailsDialogOpen] = useState(false)
  
  // Estado dos formulários
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Time | null>(null)
  const [newUserForm, setNewUserForm] = useState({
    nome: "",
    email: "",
    perfil: "",
    time: "",
  })
  const [newTeamForm, setNewTeamForm] = useState({
    nome: "",
    gestor: "",
  })
  const [editUserForm, setEditUserForm] = useState({
    nome: "",
    email: "",
  })
  const [newRole, setNewRole] = useState("")
  const [newTeam, setNewTeam] = useState("")
  const [newManager, setNewManager] = useState("")
  const [editTeamName, setEditTeamName] = useState("")

  // Dados mock de usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: "u1",
      nome: "Ana Clara Silva",
      email: "ana.silva@empresa.com",
      perfil: "Colaborador",
      times: ["Marketing"],
      status: "Ativo",
      avatar: "/placeholder.svg",
    },
    {
      id: "u2",
      nome: "Carlos Mendes",
      email: "carlos.mendes@empresa.com",
      perfil: "Gestor de Time",
      times: ["Tecnologia"],
      status: "Ativo",
      avatar: "/placeholder.svg",
    },
    {
      id: "u3",
      nome: "Marina Costa",
      email: "marina.costa@empresa.com",
      perfil: "Colaborador",
      times: ["Vendas"],
      status: "Pendente",
      avatar: "/placeholder.svg",
    },
    {
      id: "u4",
      nome: "Roberto Silva",
      email: "roberto.silva@empresa.com",
      perfil: "Gestor de Time",
      times: ["Operações"],
      status: "Ativo",
      avatar: "/placeholder.svg",
    },
    {
      id: "u5",
      nome: "Juliana Santos",
      email: "juliana.santos@empresa.com",
      perfil: "Super Admin",
      times: [],
      status: "Ativo",
      avatar: "/placeholder.svg",
    },
    {
      id: "u6",
      nome: "Pedro Oliveira",
      email: "pedro.oliveira@empresa.com",
      perfil: "Colaborador",
      times: ["Marketing", "Vendas"],
      status: "Ativo",
      avatar: "/placeholder.svg",
    },
    {
      id: "u7",
      nome: "Fernanda Lima",
      email: "fernanda.lima@empresa.com",
      perfil: "Colaborador",
      times: ["Tecnologia"],
      status: "Inativo",
      avatar: "/placeholder.svg",
    },
  ])

  // Dados mock de times
  const [times, setTimes] = useState<Time[]>([
    {
      id: "t1",
      nome: "Marketing",
      gestor: "Ana Paula Costa",
      colaboradores: ["Ana Clara Silva", "Pedro Oliveira", "João Santos", "Maria Lima"],
      status: "Ativo",
    },
    {
      id: "t2",
      nome: "Tecnologia",
      gestor: "Carlos Mendes",
      colaboradores: ["Fernanda Lima", "Ricardo Souza", "Paula Costa"],
      status: "Ativo",
    },
    {
      id: "t3",
      nome: "Vendas",
      gestor: "Roberto Silva",
      colaboradores: ["Marina Costa", "Pedro Oliveira", "Lucas Almeida"],
      status: "Ativo",
    },
    {
      id: "t4",
      nome: "Operações",
      gestor: "Mariana Santos",
      colaboradores: ["João Pedro", "Ana Silva", "Carlos Dias"],
      status: "Ativo",
    },
  ])

  const filteredUsuarios = usuarios.filter(
    (user) =>
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTimes = times.filter((team) =>
    team.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handlers de Usuário
  const handleAddUser = () => {
    console.log("[v0] Adicionando usuário:", newUserForm)
    // Aqui seria feita a chamada à API
    setIsAddUserDialogOpen(false)
    setNewUserForm({ nome: "", email: "", perfil: "", time: "" })
  }

  const handleEditUser = () => {
    if (!selectedUser) return
    console.log("[v0] Editando usuário:", selectedUser.id, editUserForm)
    setUsuarios(prev => prev.map(u => 
      u.id === selectedUser.id 
        ? { ...u, nome: editUserForm.nome, email: editUserForm.email }
        : u
    ))
    setIsEditUserDialogOpen(false)
    setSelectedUser(null)
  }

  const handleChangeRole = () => {
    if (!selectedUser || !newRole) return
    console.log("[v0] Alterando perfil do usuário:", selectedUser.id, "para", newRole)
    
    setUsuarios(prev => prev.map(u => 
      u.id === selectedUser.id 
        ? { 
            ...u, 
            perfil: newRole === "super-admin" ? "Super Admin" : newRole === "gestor" ? "Gestor de Time" : "Colaborador",
            times: newRole === "super-admin" ? [] : u.times
          }
        : u
    ))
    setIsChangeRoleDialogOpen(false)
    setSelectedUser(null)
    setNewRole("")
  }

  const handleMoveTeam = () => {
    if (!selectedUser || !newTeam) return
    console.log("[v0] Movendo usuário:", selectedUser.id, "para time:", newTeam)
    
    setUsuarios(prev => prev.map(u => 
      u.id === selectedUser.id 
        ? { ...u, times: [newTeam] }
        : u
    ))
    setIsMoveTeamDialogOpen(false)
    setSelectedUser(null)
    setNewTeam("")
  }

  const handleDeactivateUser = () => {
    if (!selectedUser) return
    console.log("[v0] Desativando usuário:", selectedUser.id)
    
    setUsuarios(prev => prev.map(u => 
      u.id === selectedUser.id 
        ? { ...u, status: "Inativo" }
        : u
    ))
    setIsDeactivateUserDialogOpen(false)
    setSelectedUser(null)
  }

  // Handlers de Time
  const handleCreateTeam = () => {
    console.log("[v0] Criando time:", newTeamForm)
    const novoTime: Time = {
      id: `t${times.length + 1}`,
      nome: newTeamForm.nome,
      gestor: newTeamForm.gestor,
      colaboradores: [],
      status: "Ativo",
    }
    setTimes(prev => [...prev, novoTime])
    setIsCreateTeamDialogOpen(false)
    setNewTeamForm({ nome: "", gestor: "" })
  }

  const handleEditTeam = () => {
    if (!selectedTeam || !editTeamName) return
    console.log("[v0] Editando time:", selectedTeam.id, "novo nome:", editTeamName)
    
    setTimes(prev => prev.map(t => 
      t.id === selectedTeam.id 
        ? { ...t, nome: editTeamName }
        : t
    ))
    setIsEditTeamDialogOpen(false)
    setSelectedTeam(null)
    setEditTeamName("")
  }

  const handleChangeManager = () => {
    if (!selectedTeam || !newManager) return
    console.log("[v0] Alterando gestor do time:", selectedTeam.id, "para:", newManager)
    
    setTimes(prev => prev.map(t => 
      t.id === selectedTeam.id 
        ? { ...t, gestor: newManager }
        : t
    ))
    setIsChangeManagerDialogOpen(false)
    setSelectedTeam(null)
    setNewManager("")
  }

  const handleArchiveTeam = () => {
    if (!selectedTeam) return
    console.log("[v0] Arquivando time:", selectedTeam.id)
    
    setTimes(prev => prev.map(t => 
      t.id === selectedTeam.id 
        ? { ...t, status: "Arquivado" }
        : t
    ))
    setIsArchiveTeamDialogOpen(false)
    setSelectedTeam(null)
  }

  const handleRemoveColaboradorFromTeam = (colaboradorNome: string) => {
    if (!selectedTeam) return
    console.log("[v0] Removendo colaborador:", colaboradorNome, "do time:", selectedTeam.id)
    
    setTimes(prev => prev.map(t => 
      t.id === selectedTeam.id 
        ? { ...t, colaboradores: t.colaboradores.filter(c => c !== colaboradorNome) }
        : t
    ))
    setSelectedTeam({
      ...selectedTeam,
      colaboradores: selectedTeam.colaboradores.filter(c => c !== colaboradorNome)
    })
  }

  // Abrir dialogs de Usuário
  const openEditUserDialog = (user: Usuario) => {
    setSelectedUser(user)
    setEditUserForm({ nome: user.nome, email: user.email })
    setIsEditUserDialogOpen(true)
  }

  const openChangeRoleDialog = (user: Usuario) => {
    setSelectedUser(user)
    setNewRole("")
    setIsChangeRoleDialogOpen(true)
  }

  const openMoveTeamDialog = (user: Usuario) => {
    setSelectedUser(user)
    setNewTeam("")
    setIsMoveTeamDialogOpen(true)
  }

  const openDeactivateUserDialog = (user: Usuario) => {
    setSelectedUser(user)
    setIsDeactivateUserDialogOpen(true)
  }

  // Abrir dialogs de Time
  const openViewTeamDialog = (team: Time) => {
    setSelectedTeam(team)
    setIsViewTeamDialogOpen(true)
  }

  const openEditTeamDialog = (team: Time) => {
    setSelectedTeam(team)
    setEditTeamName(team.nome)
    setIsEditTeamDialogOpen(true)
  }

  const openChangeManagerDialog = (team: Time) => {
    setSelectedTeam(team)
    setNewManager("")
    setIsChangeManagerDialogOpen(true)
  }

  const openArchiveTeamDialog = (team: Time) => {
    setSelectedTeam(team)
    setIsArchiveTeamDialogOpen(true)
  }

  const openTeamDetailsDialog = (team: Time) => {
    setSelectedTeam(team)
    setIsTeamDetailsDialogOpen(true)
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Gestão Organizacional
            </h1>
          </div>
          <p className="text-lg text-muted-foreground ml-14">
            Estruture usuários, times e permissões da empresa
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="usuarios" className="space-y-6">
        <TabsList className="clay-card border-0">
          <TabsTrigger value="usuarios">
            <UsersIcon className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="times">
            <UsersIcon className="h-4 w-4" />
            Times
          </TabsTrigger>
        </TabsList>

        {/* ABA: USUÁRIOS */}
        <TabsContent value="usuarios" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Gestão de Usuários</CardTitle>
                  <CardDescription className="mt-1">
                    Adicione, edite e gerencie os usuários da empresa
                  </CardDescription>
                </div>
                <Button className="clay-button" size="lg" onClick={() => setIsAddUserDialogOpen(true)}>
                  <Plus className="mr-2 h-5 w-5" />
                  Adicionar Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Busca */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tabela de Usuários */}
              <div className="space-y-3">
                {filteredUsuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={usuario.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {usuario.nome.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{usuario.nome}</p>
                        <p className="text-sm text-muted-foreground">{usuario.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {usuario.perfil}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {usuario.perfil === "Super Admin" ? "Acesso total" : usuario.times.join(", ")}
                        </p>
                      </div>
                      <Badge
                        variant={
                          usuario.status === "Ativo"
                            ? "default"
                            : usuario.status === "Pendente"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {usuario.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditUserDialog(usuario)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar usuário
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openChangeRoleDialog(usuario)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Alterar perfil
                          </DropdownMenuItem>
                          {usuario.perfil !== "Super Admin" && (
                            <DropdownMenuItem onClick={() => openMoveTeamDialog(usuario)}>
                              <UsersIcon className="mr-2 h-4 w-4" />
                              Mover de time
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => openDeactivateUserDialog(usuario)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Desativar usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsuarios.length === 0 && (
                <div className="text-center py-12">
                  <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground">Nenhum usuário encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Tente ajustar os termos de busca
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: TIMES */}
        <TabsContent value="times" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Gestão de Times</CardTitle>
                  <CardDescription className="mt-1">
                    Crie e organize os times da empresa, definindo gestores e participantes
                  </CardDescription>
                </div>
                <Button className="clay-button" size="lg" onClick={() => setIsCreateTeamDialogOpen(true)}>
                  <Plus className="mr-2 h-5 w-5" />
                  Criar Time
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Busca */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar times..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lista de Times */}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTimes.map((time) => (
                  <Card key={time.id} className="clay-card border-0">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-foreground">{time.nome}</h3>
                            <Badge variant={time.status === "Ativo" ? "default" : "secondary"}>
                              {time.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Gestor: {time.gestor}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {time.colaboradores.length} colaboradores
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewTeamDialog(time)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver time
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditTeamDialog(time)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar time
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openChangeManagerDialog(time)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Alterar gestor
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => openArchiveTeamDialog(time)}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Arquivar time
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <Button 
                          variant="outline" 
                          className="w-full bg-transparent"
                          onClick={() => openTeamDetailsDialog(time)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTimes.length === 0 && (
                <div className="text-center py-12">
                  <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground">Nenhum time encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Tente ajustar os termos de busca
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: ADICIONAR USUÁRIO */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha as informações do usuário. Um convite será enviado por e-mail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input 
                id="nome" 
                placeholder="Ex: João Silva" 
                value={newUserForm.nome}
                onChange={(e) => setNewUserForm({...newUserForm, nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="joao.silva@empresa.com" 
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil do usuário</Label>
              <Select 
                value={newUserForm.perfil}
                onValueChange={(value) => {
                  setNewUserForm({...newUserForm, perfil: value, time: value === "super-admin" ? "" : newUserForm.time})
                }}
              >
                <SelectTrigger id="perfil">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="gestor">Gestor de Time</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select 
                value={newUserForm.time}
                onValueChange={(value) => setNewUserForm({...newUserForm, time: value})}
                disabled={newUserForm.perfil === "super-admin"}
              >
                <SelectTrigger id="time" disabled={newUserForm.perfil === "super-admin"}>
                  <SelectValue placeholder={newUserForm.perfil === "super-admin" ? "Super Admin não precisa de time" : "Selecione ou crie um time"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                </SelectContent>
              </Select>
              {newUserForm.perfil === "super-admin" && (
                <p className="text-xs text-muted-foreground">
                  Super Admins têm acesso a todos os times automaticamente
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddUserDialogOpen(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button className="clay-button" onClick={handleAddUser}>
              Adicionar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR USUÁRIO */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere o nome e e-mail do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome completo</Label>
              <Input 
                id="edit-nome" 
                value={editUserForm.nome}
                onChange={(e) => setEditUserForm({...editUserForm, nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input 
                id="edit-email" 
                type="email" 
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditUserDialogOpen(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button className="clay-button" onClick={handleEditUser}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ALTERAR PERFIL */}
      <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alterar Perfil do Usuário</DialogTitle>
            <DialogDescription>
              Selecione o novo perfil para {selectedUser?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-role">Novo perfil</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Selecione o novo perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="gestor">Gestor de Time</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {newRole === "super-admin" && (
                <p className="text-xs text-accent">
                  Atenção: O vínculo com time será removido automaticamente
                </p>
              )}
              {(newRole === "colaborador" || newRole === "gestor") && selectedUser?.perfil === "Super Admin" && (
                <p className="text-xs text-accent">
                  Atenção: Será necessário vincular o usuário a um time
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeRoleDialogOpen(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button className="clay-button" onClick={handleChangeRole}>
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: MOVER DE TIME */}
      <Dialog open={isMoveTeamDialogOpen} onOpenChange={setIsMoveTeamDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mover Usuário de Time</DialogTitle>
            <DialogDescription>
              Selecione o novo time para {selectedUser?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-team">Novo time</Label>
              <Select value={newTeam} onValueChange={setNewTeam}>
                <SelectTrigger id="new-team">
                  <SelectValue placeholder="Selecione o novo time" />
                </SelectTrigger>
                <SelectContent>
                  {times.filter(t => t.status === "Ativo").map(time => (
                    <SelectItem key={time.id} value={time.nome}>
                      {time.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMoveTeamDialogOpen(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button className="clay-button" onClick={handleMoveTeam}>
              Mover Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DESATIVAR USUÁRIO */}
      <Dialog open={isDeactivateUserDialogOpen} onOpenChange={setIsDeactivateUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Desativar Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar {selectedUser?.nome}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              O usuário será marcado como inativo e não poderá mais acessar a plataforma.
              O histórico será mantido.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeactivateUserDialogOpen(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeactivateUser}>
              Desativar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CRIAR TIME */}
      <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Time</DialogTitle>
            <DialogDescription>
              Defina o nome do time e selecione o gestor responsável
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome-time">Nome do time</Label>
              <Input 
                id="nome-time" 
                placeholder="Ex: Marketing Digital" 
                value={newTeamForm.nome}
                onChange={(e) => setNewTeamForm({...newTeamForm, nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gestor-time">Gestor responsável</Label>
              <Select 
                value={newTeamForm.gestor}
                onValueChange={(value) => setNewTeamForm({...newTeamForm, gestor: value})}
              >
                <SelectTrigger id="gestor-time">
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios
                    .filter(u => u.perfil === "Gestor de Time" && u.status === "Ativo")
                    .map(gestor => (
                      <SelectItem key={gestor.id} value={gestor.nome}>
                        {gestor.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Apenas usuários com perfil "Gestor de Time" aparecem nesta lista
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateTeamDialogOpen(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button className="clay-button" onClick={handleCreateTeam}>
              Criar Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: VER TIME (do menu 3 pontos) */}
      <Dialog open={isViewTeamDialogOpen} onOpenChange={setIsViewTeamDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTeam?.nome}</DialogTitle>
            <DialogDescription>
              Informações do time
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-semibold">Nome do time</Label>
              <p className="text-sm text-muted-foreground mt-1">{selectedTeam?.nome}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Gestor</Label>
              <p className="text-sm text-muted-foreground mt-1">{selectedTeam?.gestor}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Colaboradores ({selectedTeam?.colaboradores.length})</Label>
              <div className="mt-2 space-y-2">
                {selectedTeam?.colaboradores.map((colab, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UsersIcon className="h-3 w-3" />
                    {colab}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewTeamDialogOpen(false)}
              className="bg-transparent"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR TIME */}
      <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Time</DialogTitle>
            <DialogDescription>
              Altere o nome do time
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Nome do time</Label>
              <Input 
                id="edit-team-name" 
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditTeamDialogOpen(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button className="clay-button" onClick={handleEditTeam}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ALTERAR GESTOR */}
      <Dialog open={isChangeManagerDialogOpen} onOpenChange={setIsChangeManagerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alterar Gestor do Time</DialogTitle>
            <DialogDescription>
              Selecione o novo gestor para o time {selectedTeam?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-manager">Novo gestor</Label>
              <Select value={newManager} onValueChange={setNewManager}>
                <SelectTrigger id="new-manager">
                  <SelectValue placeholder="Selecione o novo gestor" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios
                    .filter(u => u.perfil === "Gestor de Time" && u.status === "Ativo")
                    .map(gestor => (
                      <SelectItem key={gestor.id} value={gestor.nome}>
                        {gestor.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeManagerDialogOpen(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button className="clay-button" onClick={handleChangeManager}>
              Alterar Gestor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ARQUIVAR TIME */}
      <Dialog open={isArchiveTeamDialogOpen} onOpenChange={setIsArchiveTeamDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Arquivar Time</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja arquivar o time {selectedTeam?.nome}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              O time será marcado como arquivado e ficará inativo.
              Os usuários não serão removidos do sistema.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsArchiveTeamDialogOpen(false)}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleArchiveTeam}>
              Arquivar Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: VER DETALHES DO TIME (botão Ver Detalhes) */}
      <Dialog open={isTeamDetailsDialogOpen} onOpenChange={setIsTeamDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTeam?.nome} - Detalhes Completos</DialogTitle>
            <DialogDescription>
              Gerencie colaboradores e informações do time
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Nome do time</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedTeam?.nome}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Gestor</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedTeam?.gestor}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">
                  Colaboradores ({selectedTeam?.colaboradores.length})
                </Label>
                <Button size="sm" className="clay-button">
                  <Plus className="mr-2 h-3 w-3" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {selectedTeam?.colaboradores.map((colab, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {colab.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{colab}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleRemoveColaboradorFromTeam(colab)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {selectedTeam?.colaboradores.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum colaborador vinculado ainda
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                onClick={() => openChangeManagerDialog(selectedTeam!)}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Alterar Gestor
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTeamDetailsDialogOpen(false)}
              className="bg-transparent"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
