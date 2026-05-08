import { fetchCustomers } from '@/actions/customers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Users, Edit } from 'lucide-react'
import { CustomerForm } from '@/components/CustomerForm'

// Set route to dynamically fetch customers on request to ensure fresh data
export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const customers = await fetchCustomers()

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-heading text-expresso">Customers</h1>
          <p className="text-expresso/70 font-medium text-sm">Manage your customer database and contacts.</p>
        </div>
        
        <Dialog>
          <DialogTrigger render={<Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6" />}>
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline font-bold">New Customer</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none" aria-describedby="new-customer-form">
            <DialogTitle className="sr-only">Create New Customer</DialogTitle>
            <CustomerForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg border-warm-roast/10">
        <CardHeader className="bg-white-pergamino border-b border-warm-roast/5">
          <CardTitle className="text-xl font-heading text-expresso flex items-center gap-2">
            <Users className="h-5 w-5 text-coffee-fruit" />
            Customer Directory
          </CardTitle>
          <CardDescription className="text-expresso/60">
            You have {customers.length} total customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-warm-roast/5 text-expresso/70 font-bold border-b border-warm-roast/10">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">Name</th>
                  <th scope="col" className="px-6 py-4">Phone</th>
                  <th scope="col" className="px-6 py-4">Address</th>
                  <th scope="col" className="px-6 py-4">Added On</th>
                  <th scope="col" className="px-6 py-4">Last Purchase</th>
                  <th scope="col" className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-expresso/60 border-b border-warm-roast/10">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Users className="h-12 w-12 text-warm-roast/20" />
                        <p className="text-lg font-medium">No customers found</p>
                        <p className="text-sm">Click &quot;New Customer&quot; to add your first customer.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-expresso">
                        {customer.full_name}
                      </td>
                      <td className="px-6 py-4 text-expresso/80">
                        {customer.phone || <span className="text-expresso/40 italic">Not provided</span>}
                      </td>
                      <td className="px-6 py-4 text-expresso/80 max-w-xs truncate" title={customer.address || ''}>
                        {customer.address || <span className="text-expresso/40 italic">Not provided</span>}
                      </td>
                      <td className="px-6 py-4 text-expresso/70">
                        {new Date(customer.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-expresso/80 font-medium">
                        {customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : <span className="text-expresso/40 italic">Never</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Dialog>
                          <DialogTrigger render={<Button variant="ghost" size="sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 h-8 w-8 p-0 rounded-full" />}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none" aria-describedby="edit-customer-form">
                            <DialogTitle className="sr-only">Edit Customer</DialogTitle>
                            <CustomerForm initialData={customer} />
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
