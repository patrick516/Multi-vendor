# Multi-Vendor Marketplace System

## Overview

This is a modern web-based multi-vendor marketplace system. The platform allows multiple vendors to register and sell their products via a panel, while customers can browse and purchase products on the public website. The system uses Next.js and React for the frontend, Tailwind CSS for styling, and Node.js with MongoDB/Postgres for the backend.

## Features

### Public Website

- Browse products by categories.
- View product details, images, and vendor information.
- Responsive and modern design using Tailwind CSS.
- Add products to cart for checkout.

### Vendor Panel

- Vendors are added by the system owner.
- Each vendor can add, update, and manage their products.
- Track orders related to their products.
- View sales and commissions.

### Admin / Owner Panel

- Manage all vendors and customers.
- Oversee all products and orders.
- Configure commissions, product categories, and system settings.
- Super-admin privileges for system maintenance.

## Technology Stack

- Frontend: React, Next.js, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB / PostgreSQL
- Authentication & Authorization for users and vendors
- Prisma ORM (if using Postgres)
- Image handling for product galleries

## Folder Structure

- **frontend/** — React app with Tailwind for testing components.
- **website/** — Next.js project for the public website and vendor panel.
- **backend/** — Node.js / Express server with database integration.

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
