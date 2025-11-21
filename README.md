Observation Service – Microservice d’écosystème naturel

Ce microservice gère les espèces, les observations, ainsi qu’un système avancé de rareté et réputation utilisateur.
Il fonctionne avec un second microservice : auth_service, responsable de l’authentification et de l’émission des JWT.

1. Authentification via JWT (depuis auth_service)

Toutes les actions sensibles (création d’espèce, observation, validation/rejet…) utilisent un middleware dédié :

- Vérification du header Authorization: Bearer <token>

- Décodage du JWT

- Injection automatique dans req.user :

    { id, email, role }


Cela permet d’associer chaque action à l’utilisateur connecté.

2. Gestion des espèces (Species)
Actions disponibles :

    POST /species → crée une espèce (protégé par JWT)
    
    GET /species → liste toutes les espèces
    
    GET /species/:id → retourne une espèce spécifique

Règles de gestion :

Impossible de créer deux espèces avec le même nom

L’espèce est automatiquement associée à son créateur via authorId

Chaque espèce possède un rarityScore mis à jour automatiquement selon :

Indice de rareté
rarityScore = 1 + (nombreObservationsValidees / 5)


Mis à jour après chaque validation ou rejet.

👁️ 3. Gestion des observations
Actions disponibles :

    POST /observations → créer une observation
    
    GET /observations/species/:id → liste les observations d’une espèce
    
    POST /observations/:id/validate → valider une observation
    
    POST /observations/:id/reject → rejeter une observation

Règles métier :

Impossible de créer deux observations sur la même espèce dans les 5 minutes

Un utilisateur ne peut pas valider/rejeter ses propres observations

    Validation → change le statut en VALIDATED
    
    Rejet → change le statut en REJECTED

Chaque action de validation/rejet met automatiquement à jour :

la rareté de l’espèce

la réputation des utilisateurs concernés

4. Système de Réputation

Cette partie simule un véritable écosystème “communautaire”.

Formule :
    Action	Score
    Observation validée	+3
    Observation rejetée	-1
    Validation par un utilisateur expert	+1
    Promotion automatique au rang EXPERT
    Un utilisateur devient expert à partir de 10 points de réputation.


Les experts influencent davantage la réputation des autres.

Endpoint de réputation

Ajout d’un endpoint permettant de consulter toutes les réputations :

GET /reputations



 Structure de la base de données (Prisma)
Species

      id
      
      name
      
      authorId
      
      rarityScore
      
      createdAt
      
      observations[]
      
      Observation
      
      id
      
      speciesId
      
      authorId
      
      description
      
      status (PENDING / VALIDATED / REJECTED)
      
      validatedBy
      
      validatedAt
      
      createdAt
      
      Reputation
      
      userId
      
      reputation
      
      isExpert
      
      updatedAt

🧪 Tests recommandés
1. Créer un compte + login dans auth_service

  → Récupérer un token JWT

2. Créer une espèce

  POST /species
  avec Authorization: Bearer <token>

3. Créer plusieurs observations

    POST /observations

4. Valider/Rejeter

    POST /observations/:id/validate

→ vérifier la rareté de l’espèce
→ vérifier la réputation du créateur et du validateur

5. Vérifier les réputations

    GET /reputations

Technologies

Node.js / Express

Prisma ORM

SQLite (facile à tester)

JWT

Architecture microservices

Objectif global

    Ce microservice permet de simuler un écosystème d’observations en introduisant :
    
    des contraintes temporelles,
    
    une gamification via la réputation,
    
    une classification dynamique des espèces,
    
    un rôle d’experts déterminé automatiquement.
    
    Il s’intègre avec un service d’authentification externe via JWT, selon une vraie logique microservices.
