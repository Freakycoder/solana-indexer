import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <motion.footer 
      className="bg-black/50 border-t border-green-500/20 py-12 mt-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <Zap className="w-5 h-5 text-black" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                SolanaFy
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              The premier destination for Solana NFTs. Discover, trade, and collect with confidence.
            </p>
          </motion.div>

          {[
            {
              title: 'Marketplace',
              links: ['Explore', 'Collections', 'Activity', 'Rankings']
            },
            {
              title: 'Resources',
              links: ['Documentation', 'API', 'Support', 'Blog']
            },
            {
              title: 'Community',
              links: ['Discord', 'Twitter', 'Telegram', 'GitHub']
            }
          ].map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + sectionIndex * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <motion.li key={link}>
                    <motion.a
                      href="#"
                      className="text-gray-400 hover:text-green-400 transition-colors duration-300 block"
                      whileHover={{ x: 4 }}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + sectionIndex * 0.1 + linkIndex * 0.05 }}
                      viewport={{ once: true }}
                    >
                      {link}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="border-t border-green-500/20 mt-8 pt-8 text-center text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          viewport={{ once: true }}
        >
          <p>&copy; 2024 SolanaFy. Built with 💚 for the Solana ecosystem.</p>
        </motion.div>
      </div>
    </motion.footer>
  );
}